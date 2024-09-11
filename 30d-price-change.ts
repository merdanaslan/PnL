import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const apikey = process.env.API_KEY;
const tokenPriceApiKey = process.env.TOKEN_PRICE_API_KEY;

const solanafmBaseUrl = "https://api.solana.fm";
const birdeyeBaseUrl = "https://public-api.birdeye.so";

interface TokenBalance {
  mint: string;
  symbol: string;
  balance: number;
}

async function getWalletTokens(walletAddress: string): Promise<TokenBalance[]> {
  try {
    const response = await axios.get(`${solanafmBaseUrl}/v0/addresses/${walletAddress}/tokens`, {
      headers: { ApiKey: apikey },
    });

    console.log("API Response:", JSON.stringify(response.data, null, 2));

    if (!Array.isArray(response.data) || response.data.length === 0) {
      console.log("No tokens found for this wallet.");
      return [];
    }

    return response.data.map((token: any) => ({
      mint: token.mint,
      symbol: token.symbol || token.mint.slice(0, 8),
      balance: parseFloat(token.amount) / Math.pow(10, token.decimals),
    }));
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        console.error(`Wallet not found or has no tokens: ${walletAddress}`);
      } else {
        console.error(`API error: ${error.response.status} - ${error.response.data}`);
      }
    } else {
      console.error(`An unexpected error occurred: ${error}`);
    }
    return [];
  }
}

async function getTokenPrice(tokenMint: string, timestamp: number): Promise<number> {
  const response = await axios.get(`${birdeyeBaseUrl}/defi/history_price`, {
    params: {
      address: tokenMint,
      address_type: "token",
      type: "1d",
      time_from: timestamp,
      time_to: timestamp + 86400,
    },
    headers: { "X-API-KEY": tokenPriceApiKey },
  });

  if (response.data.data.items && response.data.data.items.length > 0) {
    return response.data.data.items[0].value;
  }
  return 0;
}

async function calculateWalletNetWorth(tokens: TokenBalance[], timestamp: number): Promise<number> {
  let totalWorth = 0;
  for (const token of tokens) {
    const price = await getTokenPrice(token.mint, timestamp);
    totalWorth += token.balance * price;
  }
  return totalWorth;
}

async function main() {
  const walletAddress = process.argv[2] || "9sanPaycTAq3HeiqUYGebsa3UVhawhAWHNwRzPdcfRn8";
  const currentDate = new Date();
  const startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  console.log(`Analyzing wallet: ${walletAddress}`);
  console.log(`Start date: ${startDate.toISOString()}`);
  console.log(`End date: ${currentDate.toISOString()}`);

  try {
    const tokens = await getWalletTokens(walletAddress);
    
    if (tokens.length === 0) {
      console.log("No tokens found for this wallet. Unable to calculate net worth.");
      return;
    }

    const startNetWorth = await calculateWalletNetWorth(tokens, Math.floor(startDate.getTime() / 1000));
    const endNetWorth = await calculateWalletNetWorth(tokens, Math.floor(currentDate.getTime() / 1000));

    const performancePercentage = ((endNetWorth - startNetWorth) / startNetWorth) * 100;

    console.log(`\nWallet Net Worth 30 days ago: $${startNetWorth.toFixed(2)}`);
    console.log(`Current Wallet Net Worth: $${endNetWorth.toFixed(2)}`);
    console.log(`30-Day Performance: ${performancePercentage.toFixed(2)}%`);

  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
