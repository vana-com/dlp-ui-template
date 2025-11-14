# Environment Variables

This document describes all environment variables needed for the Thinker DLP UI.

## Required Variables

### Google OAuth Configuration

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

Get these from [Google Cloud Console](https://console.cloud.google.com/):
1. Create a project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Add `http://localhost:3000/api/auth/callback/google` as redirect URI

### NextAuth Configuration

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
```

Generate a secret with: `openssl rand -base64 32`

### Vana Runtime Configuration

```bash
NEXT_PUBLIC_DLP_RUNTIME_URL=http://localhost:8000
NEXT_PUBLIC_TASK_ID=999
```

**Note:** These use `NEXT_PUBLIC_` prefix so they're available in the browser. The vana-runtime has CORS enabled to accept requests from the UI.

- `NEXT_PUBLIC_DLP_RUNTIME_URL`: URL of your Vana Runtime instance (default: http://localhost:8000)
- `NEXT_PUBLIC_TASK_ID`: Task ID for the Thinker task (default: 999)

### Smart Contract Addresses

```bash
NEXT_PUBLIC_DATA_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_DLP_ADDRESS=0x...
NEXT_PUBLIC_TEE_POOL_ADDRESS=0x...
```

Update these with your deployed contract addresses.

### Network Configuration

```bash
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://rpc.vana.org
```

### Data Schema Configuration

```bash
NEXT_PUBLIC_SCHEMA_ID=36
```

**Note:** The schema ID identifies the data format registered in the Vana network for this DLP. All uploaded thoughts will be tagged with this schema ID for proper validation and processing.

## Optional Variables

### Testing

```bash
NEXT_PUBLIC_PROOF_URL=http://localhost:8080
```

Only needed if using a local TEE for testing.

## Setup Instructions

### Development

1. Copy this template to `.env.local`:

```bash
# Create .env.local file
cat > .env.local << 'EOF'
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Vana Runtime (client-side, needs NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_DLP_RUNTIME_URL=http://localhost:8000
NEXT_PUBLIC_TASK_ID=999

# Smart Contracts (only DLP contract address needed)
NEXT_PUBLIC_DLP_CONTRACT_ADDRESS=

# Network
NEXT_PUBLIC_CHAIN_ID=14800
NEXT_PUBLIC_RPC_URL=https://rpc.moksha.vana.org

# Data Schema
NEXT_PUBLIC_SCHEMA_ID=36
EOF
```

2. Fill in your values

3. Start the dev server:

```bash
yarn dev
```

### Production

Set environment variables in your hosting platform (Vercel, Netlify, etc.)

## Testing the Runtime Connection

To verify your runtime connection is working:

```bash
# Check runtime health
curl http://localhost:8000/health

# Check task status
curl http://localhost:8000/v1/tasks/999
```

## Troubleshooting

### "Runtime task request failed"

- Verify `NEXT_PUBLIC_DLP_RUNTIME_URL` is correct
- Ensure Vana Runtime is running: `docker-compose up -d` (in vana-runtime directory)
- Check runtime logs: `docker-compose logs -f vana-runtime`

### "Task not found"

- Verify `NEXT_PUBLIC_TASK_ID` matches your registered task
- Ensure task is registered in runtime (see IMPLEMENTATION_SUMMARY.md)
- Check task status: `curl http://localhost:8000/v1/tasks/999`

### "Google authentication failed"

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure redirect URI is configured in Google Cloud Console
- Check NextAuth configuration

## Security Notes

- Never commit `.env.local` or `.env` files to git
- Keep `NEXTAUTH_SECRET` secure and random
- Use environment-specific values for production
- Rotate secrets regularly

