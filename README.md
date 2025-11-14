# Thinker DLP UI

A specialized UI for contributing reflective thoughts to the Thinker Data Liquidity Pool (DLP). This app enables users to share short reflective thoughts while maintaining privacy through client-side encryption.

## What is Thinker DLP?

Thinker is a low-friction, text-only DLP where contributors anonymously submit short reflective thoughts (1-3 sentences). The Thinker task extracts keywords from thoughts and tracks their evolution over time, generating insights about collective wisdom patterns.

## How It Works

1. **Connect Your Wallet** - Connect your EVM compatible wallet with $VANA tokens
2. **Sign in with Google** - Login to Google for encrypted storage in your Drive
3. **Share Your Thought** - Type a reflective thought (10-500 characters)
4. **Client-Side Encryption** - Your thought is encrypted before leaving your browser
5. **Private Storage** - Encrypted thought stored in your personal Google Drive
6. **On-Chain Registration** - A transaction records your contribution on the VANA network
7. **TEE Validation** - The Thinker task processes your thought in a trusted environment
8. **Keyword Extraction** - Your thought contributes to keyword evolution insights
9. **Earn Rewards** - Receive rewards for your contribution

## Features

### Thought Contribution
- **Beautiful Input UI** - Intuitive textarea with character counter (10-500 chars)
- **Real-time Validation** - Color-coded feedback for valid thoughts
- **Example Thoughts** - Guidance dropdown with sample reflections
- **Multiple Contributions** - Easy reset to contribute more thoughts

### Privacy & Security
- **Client-Side Encryption** - OpenPGP encryption before any data leaves your browser
- **User-Owned Storage** - Encrypted thoughts stored in your Google Drive
- **Wallet-Based Identity** - Contributor ID from wallet address or email
- **TEE Processing** - Thoughts decrypted only in trusted execution environment

### Network Integration
- **Para Wallet Support** - Secure wallet connection with Wagmi
- **Smart Contract Integration** - On-chain registration using Vana DataRegistry
- **TEE Validation** - Automatic validation through the Satya Network
- **Reward System** - Earn tokens for thought contributions

### User Experience
- **4-Step Progress** - Clear visual progress through contribution flow
- **Keyword Insights** - View keywords extracted from your thoughts ✨
- **Dark Mode Support** - Beautiful UI in light and dark themes
- **Responsive Design** - Works on desktop and mobile
- **Error Handling** - Clear feedback for any issues

## Prerequisites

- Node.js (version 16 or newer)
- Yarn package manager
- An EVM-compatible wallet with $VANA tokens
- Google Drive or Dropbox account

## Quick Start

```bash
# 1. Start runtime
cd ../vana-runtime && docker-compose up -d

# 2. Build task image
cd ../vana-task-demo && docker build -t vana/thinker-task:demo .

# 3. Start task (registers and starts for DLP 186)
cd ../dlp-ui-template && ./start-thinker-task.sh

# 4. Configure and run UI
yarn install
cp .env.local.example .env.local
# Edit .env.local with your credentials
yarn dev

# Open http://localhost:3000
```

---

## Getting Started

### Prerequisites

1. **Vana Runtime** - The Thinker task runtime must be running
2. **Google OAuth credentials** - For user authentication
3. **Wallet with $VANA** - For blockchain transactions

### Installation

```bash
# 1. Install dependencies
yarn install

# 2. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Google OAuth credentials
# See ENV_VARIABLES.md for detailed instructions

# 3. Start Vana Runtime
cd ../vana-runtime
docker-compose up -d

# 4. Build and Start Thinker Task
cd ../vana-task-demo
docker build -t vana/thinker-task:demo .

cd ../dlp-ui-template
./start-thinker-task.sh

# 5. Run the development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app running.

### Environment Variables

See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for complete documentation on required environment variables.

## Client-side encryption

The Vana network strives to ensure personal data remains private, and is only shared with trusted parties. You can read more about how a DLP uses client-side encryption to protect user data [here](https://docs.vana.org/docs/data-privacy).

## Data Validation

Data submitted to the Vana network is validated using a Proof of Contribution system through the Satya Network, which consists of highly confidential nodes running on special hardware. The validation process ensures:

1. Your encrypted data is securely decrypted within a trusted execution environment (Intel TDX)
2. Custom validation logic for your DLP runs against the data
3. Attestations are generated and proofs are written on-chain

For more details about how data validation works on Vana, see the [data validation documentation](https://docs.vana.org/docs/data-validation).

## Testing

### Quick Test

```bash
# Start the development server
yarn dev

# Open http://localhost:3000
# 1. Sign in with Google
# 2. Connect your wallet
# 3. Type a reflective thought
# 4. Click "Contribute Your Thought"
# 5. Watch the 5-step progress
```

### Testing with Vana Runtime

```bash
# Terminal 1: Start Vana Runtime
cd ../vana-runtime
docker-compose up -d

# Terminal 2: Start Thinker Task
cd ../vana-task-demo
docker build -t vana/thinker-task:demo .
# Follow THINKER_DEMO.md for task registration

# Terminal 3: Start UI
cd ../dlp-ui-template
yarn dev
```

## Architecture

### Data Flow
```
User Input → Validation → Encryption → Google Drive → Blockchain → TEE → Thinker Task
                                                                            ↓
                                                                    Keyword Extraction
                                                                            ↓
                                                                    Evolution Tracking
```

### Key Components
- **ThoughtInput** - Input component with validation
- **VanaDlpIntegration** - Main contribution flow
- **ContributionSteps** - Progress visualization
- **ContributionSuccess** - Success screen with reset

## Learn more

- [Vana DLP Documentation](https://docs.vana.org/docs/how-to-create-a-data-liquidity-pool)
- [Vana Network](https://vana.org)

## License

[MIT](LICENSE)
