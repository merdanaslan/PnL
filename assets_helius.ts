import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

interface Asset {
  // Define the asset properties based on the API response
  id: string;
  interface: string;
  // Add other properties as needed
}

interface GetAssetsByOwnerResponse {
  result: {
    total: number;
    limit: number;
    page: number;
    items: Asset[];
  };
}

export async function getAssetsByOwner(ownerAddress: string, page: number = 1, limit: number = 1000): Promise<Asset[]> {
  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress,
          page,
          limit,
          displayOptions: {
            showFungible: true,
            showNativeBalance: true,
            showInscription: true,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as GetAssetsByOwnerResponse;
    return data.result.items;
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
}

// Example usage
async function main() {
  const ownerAddress = '7orgFWEBNCsqspUTX8AZurjRfHrgRYZiswm4ewqJmH9E'; // Example address
  try {
    const assets = await getAssetsByOwner(ownerAddress);
    console.log('Assets:', assets);
  } catch (error) {
    console.error('Error in main:', error);
  }
}

// Uncomment the following line to run the example
main();
