# ZITE - CONFIDENTIAL DONATION PLATFORM.

Zite is a confidential donation platform that lets anyone contribute to meaningful causes privately, without exposing how much they gave.

<img width="1440" height="715" alt="Screenshot 2025-11-01 at 15 02 33" src="https://github.com/user-attachments/assets/00bcec7c-3f68-4611-82ab-f8724054829c" />

## ✨ Key Features

🔒 Fully Private Donations: Amounts are encrypted client-side and stored encrypted on-chain. No one sees them unless allowed.
🧠 Homomorphic Aggregation: Totals are calculated using Fully Homomorphic Encryption — without decrypting on-chain.
🎛 Reveal Policy Control: The round creator chooses when totals become visible: • After the round ends • After the round ends and goal is met • Never reveal
🙋 Donor Self-Decryption: Each donor can decrypt only their own contributions at any time.
📊 Conditional Total Reveal: If the reveal conditions are met, the owner can unlock the total for public visibility.
💸 Secure Payout Flow: Funds can be released to the beneficiary only after the round ends. No forced trust needed.
⏱ Live Status + Countdown: Displays real-time round phase: Upcoming, Live, or Ended, with timer.
🧱 Clean Web3 UX:	Native MetaMask support, no extra extensions or setup required.
🎨 Modern Responsive UI: A smooth, minimal interface designed to make privacy feel natural and intuitive.

## 🧭 How It Works (Simplified)

1. User enters donation amount
2. Amount is encrypted locally in browser
3. Encrypted value is sent to the smart contract
4. Contract adds encrypted values together using Zama FHEVM
5. Donors can decrypt only their own donation
6. Round totals unlock only when the policy conditions are satisfied
100% on-chain confidentiality.

## 🎯 Example Use Cases

* Crowdfunding sensitive causes
* Charity funding without public donor pressure
* DAO-based payroll / grants where privacy matters
* Community support projects

🛠 Built With

* Zama FHEVM (Fully Homomorphic Encryption Virtual Machine)
* Solidity + Hardhat
* Next.js (App Router) UI
* MetaMask / EIP-1193 Wallets

## Project Structure

This repository has a monorepo structure with the following components:

```
app/
├── packages/
│   ├── contract/                  # Smart contracts & deployment
│   ├── fhevm-sdk/                 # FHEVM SDK package
│   └── frontend/                  # React application
└── scripts/                       # Build and deployment scripts
```

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd dapps

# Install dependencies
pnpm install
```

### 2. Environment Configuration

Set up your Hardhat environment variables by following the [FHEVM documentation](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup#set-up-the-hardhat-configuration-variables-optional):

- `MNEMONIC`: Your wallet mnemonic phrase
- `INFURA_API_KEY`: Your Infura API key for Sepolia

### 3. Start Development Environment

**Option A: Local Development (Recommended for testing)**

```bash
# Terminal 1: Start local Hardhat node
pnpm chain
# RPC URL: http://127.0.0.1:8545 | Chain ID: 31337

# Terminal 2: Deploy contracts to localhost
pnpm deploy:localhost

# Terminal 3: Start the frontend
pnpm run start
```

**Option B: Sepolia Testnet**

```bash
# Deploy to Sepolia testnet
pnpm deploy:sepolia

# Start the frontend
pnpm run start
```

### 4. Connect MetaMask

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Click "Connect Wallet" and select MetaMask
3. If using localhost, add the Hardhat network to MetaMask:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`

### ⚠️ Sepolia Production note

- In production, `NEXT_PUBLIC_ALCHEMY_API_KEY` must be set (see `packages/erc7984example/scaffold.config.ts`). The app throws if missing.
- Ensure `packages/frontend/contracts/deployedContracts.ts` points to your live contract addresses.
- Optional: set `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` for better WalletConnect reliability.
- Optional: add per-chain RPCs via `rpcOverrides` in `packages/erc7984example/scaffold.config.ts`.

## 🔧 Troubleshooting

### Common MetaMask + Hardhat Issues

When developing with MetaMask and Hardhat, you may encounter these common issues:

#### ❌ Nonce Mismatch Error

**Problem**: MetaMask tracks transaction nonces, but when you restart Hardhat, the node resets while MetaMask doesn't update its tracking.

**Solution**:
1. Open MetaMask extension
2. Select the Hardhat network
3. Go to **Settings** → **Advanced**
4. Click **"Clear Activity Tab"** (red button)
5. This resets MetaMask's nonce tracking

#### ❌ Cached View Function Results

**Problem**: MetaMask caches smart contract view function results. After restarting Hardhat, you may see outdated data.

**Solution**:
1. **Restart your entire browser** (not just refresh the page)
2. MetaMask's cache is stored in extension memory and requires a full browser restart to clear

> 💡 **Pro Tip**: Always restart your browser after restarting Hardhat to avoid cache issues.

For more details, see the [MetaMask development guide](https://docs.metamask.io/wallet/how-to/run-devnet/).

## Contributing

This repository serves as a comprehensive example of building privacy-preserving dApps with fhEVM. Feel free to explore the examples, run the tests, and use them as a foundation for your own projects.

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

