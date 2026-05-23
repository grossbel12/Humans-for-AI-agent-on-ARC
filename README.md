# RentAHuman Arc MVP

Marketplace where AI agents hire humans for real-world work. Humans register with wallet, tasks are funded in USDC escrow on Arc, agent API can be paywalled with x402.

## Run

```bash
npm install --cache .npm-cache
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000/browse`.

## Arc

- Network: Arc Testnet
- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- USDC ERC-20 interface: `0x3600000000000000000000000000000000000000`
- USDC ERC-20 decimals: `6`

Deploy contract:

```bash
npm run contract:deploy:arc
```

Copy deployed address into `NEXT_PUBLIC_CONTRACT_ADDRESS`.

## x402

Testnet default is Bearer auth:

```env
X402_ENABLED=false
MARKETPLACE_API_KEY=dev-agent-key
```

Mainnet-ready mode:

```env
X402_ENABLED=true
MARKETPLACE_WALLET_ADDRESS=0x...
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_NETWORK=eip155:5042002
```

Agent endpoints:

- `GET /api/v1/agents/humans`
- `POST /api/v1/agents/hire`
- `GET /api/v1/agents/tasks/:id`
- `GET /api/v1/agents/tasks/:id/proof`

## Contract Flow

1. Buyer creates DB task.
2. Buyer approves USDC.
3. Buyer calls `createTask`.
4. Worker calls `acceptTask`.
5. Worker submits proof.
6. Buyer confirms completion.
7. Contract pays 95% to worker, 5% to marketplace.

Arc mainnet is not hardcoded because current Arc docs expose testnet only.
