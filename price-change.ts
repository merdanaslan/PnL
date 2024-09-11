import { Connection, PublicKey } from '@solana/web3.js';
import fetch from 'node-fetch';
import axios from 'axios';

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

interface TokenBalance {
    mint: string;
    balance: number;
}

interface TokenPerformance {
    mint: string;
    symbol: string;
    balance: number;
    startPrice: number;
    endPrice: number;
    performancePercentage: number;
}

const knownTokens: { [key: string]: string } = {
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
    'So11111111111111111111111111111111111111112': 'SOL',
    // Add more known tokens here
};

async function getWalletTokens(walletAddress: string): Promise<TokenBalance[]> {
    console.log(`Fetching wallet tokens for address: ${walletAddress}`);
    const connection = new Connection(SOLANA_RPC_URL);
    
    try {
        const wallet = new PublicKey(walletAddress);
        console.log('PublicKey created successfully');

        console.log('Fetching token accounts...');
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        });

        console.log(`Found ${tokenAccounts.value.length} token accounts`);
        
        if (tokenAccounts.value.length === 0) {
            console.log('This wallet has no token accounts or might be empty.');
            return [];
        }

        return tokenAccounts.value.map(account => {
            const balance = parseFloat(account.account.data.parsed.info.tokenAmount.amount) / 10 ** account.account.data.parsed.info.tokenAmount.decimals;
            console.log(`Token: ${account.account.data.parsed.info.mint}, Balance: ${balance}`);
            return {
                mint: account.account.data.parsed.info.mint,
                balance: balance,
            };
        });
    } catch (error) {
        console.error('Error fetching wallet tokens:', error);
        throw error;
    }
}

async function getTokenSymbol(mintAddress: string): Promise<string> {
    console.log(`Fetching symbol for token: ${mintAddress}`);
    if (knownTokens[mintAddress]) {
        console.log(`Symbol for ${mintAddress}: ${knownTokens[mintAddress]}`);
        return knownTokens[mintAddress];
    }
    try {
        const response = await axios.get(`https://public-api.solscan.io/token/meta?tokenAddress=${mintAddress}`);
        if (response.status === 200 && response.data.symbol) {
            console.log(`Symbol for ${mintAddress}: ${response.data.symbol}`);
            return response.data.symbol;
        } else {
            console.log(`Failed to fetch symbol for ${mintAddress}. Using mint address as symbol.`);
            return mintAddress.slice(0, 8); // Use first 8 characters of mint address as symbol
        }
    } catch (error) {
        console.error(`Error fetching symbol for ${mintAddress}:`, error);
        return mintAddress.slice(0, 8); // Use first 8 characters of mint address as symbol
    }
}

async function getHistoricalPrice(tokenSymbol: string, date: string): Promise<number | null> {
    console.log(`Fetching historical price for ${tokenSymbol} on ${date}`);
    try {
        const response = await axios.get(`https://price.jup.ag/v4/price?ids=${tokenSymbol}&vsToken=USDC&date=${date}`);
        if (response.status === 200 && response.data.data[tokenSymbol]) {
            const price = response.data.data[tokenSymbol].price;
            console.log(`Price for ${tokenSymbol} on ${date}: ${price}`);
            return price;
        } else {
            console.log(`Failed to fetch price for ${tokenSymbol} on ${date}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching price for ${tokenSymbol}:`, error);
        return null;
    }
}

async function calculateWalletPerformance(walletAddress: string): Promise<TokenPerformance[]> {
    const tokens = await getWalletTokens(walletAddress);
    const currentDate = new Date();
    const startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const performances: TokenPerformance[] = [];

    for (const token of tokens) {
        console.log(`Processing token: ${token.mint}`);
        const symbol = await getTokenSymbol(token.mint);
        await delay(1000); // Wait 1 second between API calls
        const startPrice = await getHistoricalPrice(symbol, startDate.toISOString().split('T')[0]);
        await delay(1000); // Wait 1 second between API calls
        const endPrice = await getHistoricalPrice(symbol, currentDate.toISOString().split('T')[0]);

        if (startPrice && endPrice) {
            const performancePercentage = ((endPrice - startPrice) / startPrice) * 100;
            performances.push({
                mint: token.mint,
                symbol,
                balance: token.balance,
                startPrice,
                endPrice,
                performancePercentage,
            });
        } else {
            console.log(`Skipping ${symbol} due to missing price data`);
        }
    }

    return performances;
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    // Get wallet address from command line argument or use a default
    const walletAddress = process.argv[2] || '5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CmPEwKgVWr8';

    if (!walletAddress) {
        console.error('Please provide a wallet address as a command-line argument.');
        console.error('Usage: ts-node price-change.ts <wallet-address>');
        process.exit(1);
    }

    console.log(`Using wallet address: ${walletAddress}`);

    try {
        console.log('Calculating wallet performance...');
        const performances = await calculateWalletPerformance(walletAddress);
        
        if (performances.length === 0) {
            console.log('No token performances calculated. The wallet might be empty or there was an issue fetching data.');
            return;
        }

        console.log('Wallet 30-Day Performance:');
        performances.forEach(perf => {
            console.log(`${perf.symbol}: ${perf.performancePercentage.toFixed(2)}% (Balance: ${perf.balance.toFixed(2)})`);
        });

        // Calculate overall wallet performance (weighted by current value)
        const totalValue = performances.reduce((sum, perf) => sum + perf.balance * perf.endPrice, 0);
        const overallPerformance = performances.reduce((sum, perf) => {
            const weight = (perf.balance * perf.endPrice) / totalValue;
            return sum + perf.performancePercentage * weight;
        }, 0);

        console.log(`\nOverall Wallet Performance: ${overallPerformance.toFixed(2)}%`);

        // Here you would add logic to mint an NFT based on the overall performance
        // For example:
        // if (overallPerformance > 20) {
        //     mintPerformanceNFT(walletAddress, 'gold');
        // } else if (overallPerformance > 10) {
        //     mintPerformanceNFT(walletAddress, 'silver');
        // } else if (overallPerformance > 0) {
        //     mintPerformanceNFT(walletAddress, 'bronze');
        // }
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

// Call main function and handle any unhandled promise rejections
main().catch(error => {
    console.error('Unhandled error in main:', error);
});