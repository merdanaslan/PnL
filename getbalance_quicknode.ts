import { Connection, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

const quickNodeApiKey = process.env.QUICKNODE_API_KEY;
const walletAddress = "7orgFWEBNCsqspUTX8AZurjRfHrgRYZiswm4ewqJmH9E";

const getWalletBalance = async (): Promise<void> => {
  try {
    const quickNodeUrl = `https://docs-demo.solana-mainnet.quiknode.pro/${quickNodeApiKey}/`;
    const connection = new Connection(quickNodeUrl);

    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    const accountinfo = await connection.getAccountInfo(publicKey);

    console.log(`Wallet balance: ${balance / 1e9} SOL`);
    console.log(accountinfo);
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
  }
};

getWalletBalance();