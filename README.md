# Performance Tracker

This project provides tools to analyze and track the performance of Solana wallets. It includes scripts to fetch transaction history, calculate token balances, and determine the 30-day price change for tokens in a given wallet.


## Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)
- A Solana wallet address to analyze
- API keys for Solana.fm and Birdeye

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/merdanaslan/PnL.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:
   ```
   API_KEY=your_solana_fm_api_key
   TOKEN_PRICE_API_KEY=your_birdeye_api_key
   ```

## Usage

### Fetch Transaction History

To fetch the transaction history for a wallet:

```
ts-node data.ts
```

This will use the wallet address specified in the `data.ts` file.

### Calculate 30-Day Price Change

To calculate the 30-day price change for tokens in a wallet:

```
ts-node price-change.ts <wallet-address>
```

Replace `<wallet-address>` with the Solana wallet address you want to analyze.

