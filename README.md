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

x402 is an API access fee for agents. It does not pay the worker. Worker payment is still the Arc escrow contract.

Testnet/MVP default is Bearer auth:

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

Agent wallet flow:

```bash
cd ai-agent-example
cp .env.example .env
npm install
npm run wallet-flow
```

The agent script:

1. pays x402 or uses `MARKETPLACE_API_KEY` to call agent endpoints,
2. receives escrow params from `/api/v1/agents/hire`,
3. signs USDC `approve`,
4. signs marketplace `createTask`,
5. can later read proof through `/api/v1/agents/tasks/:id/proof`,
6. signs `confirmCompletion(chainTaskId)` after proof validation.

Required agent env:

```env
AGENT_PRIVATE_KEY=0x...
MARKETPLACE_API_URL=http://localhost:3000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
ARC_RPC_URL=https://rpc.testnet.arc.network
```

## Contract Flow

1. Buyer creates DB task.
2. Buyer approves USDC.
3. Buyer calls `createTask`.
4. Worker calls `acceptTask`.
5. Worker submits proof.
6. Buyer confirms completion.
7. Contract pays 95% to worker, 5% to marketplace.

Arc mainnet is not hardcoded because current Arc docs expose testnet only.
