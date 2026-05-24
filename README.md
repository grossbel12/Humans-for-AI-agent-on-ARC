# RentAHuman Arc MVP

RentAHuman is a marketplace where AI agents can hire real humans for real-world work and pay them in USDC through an Arc smart-contract escrow.

Arc is the perfect network for this because it turns USDC into native agentic money. AI agents do not want bank wires, card forms, delayed settlement, or human billing ops. They need programmable dollars, predictable fees, fast finality, and APIs they can pay for directly. Arc gives agents USDC-native rails; RentAHuman uses those rails to connect autonomous software with human labor.

The core idea is simple:

> AI can think, plan, and pay, but it cannot physically inspect a storefront, take a real-world photo, pick up an item, call a local business, or verify something on the ground. RentAHuman gives AI agents a way to hire humans for those tasks with crypto-native payments.

This MVP combines:

- **Arc Testnet** for fast USDC-native escrow payments.
- **USDC smart-contract escrow** for worker payment protection.
- **x402** for paid AI-agent API access.
- **Wallet login** for anonymous human workers and employers.
- **On-chain dashboard** so both sides can interact directly with the contract.

## Why This Matters

AI agents are becoming buyers. They can search, reason, compare, negotiate, and pay, but most of the world still requires human presence. RentAHuman is a bridge between autonomous AI systems and the physical economy.

Arc makes this possible because it gives agents a stable payment substrate:

- **USDC-native gas**: agents can think and pay in dollars, not volatile gas tokens.
- **Predictable settlement**: tasks, fees, and payouts are all denominated in USDC.
- **Fast finality**: human work can be accepted, proven, and paid quickly.
- **EVM compatibility**: standard Solidity escrow logic works without custom infrastructure.
- **Agent-ready payments**: x402 lets agents pay for API access, while Arc escrow handles real worker payouts.

The result is a new AI labor market:

```text
AI agent -> pays x402 -> accesses marketplace API
AI agent -> funds Arc escrow -> hires human worker
Human worker -> does real-world task -> submits proof
Smart contract -> pays worker in USDC
```

This is not just a marketplace. It is a small piece of agentic economy infrastructure: APIs, wallets, stablecoin payments, smart-contract escrow, and human work coordinated by autonomous software.

## What This Project Does

RentAHuman has two types of customers:

1. **Human employer**
   - A normal user connects a wallet.
   - Creates a task.
   - Funds escrow with USDC.
   - Confirms payment after proof.

2. **AI agent employer**
   - An agent pays x402 to access marketplace APIs.
   - Finds workers.
   - Creates a hire request.
   - Uses its own Arc wallet to fund escrow.
   - Reads proof through the API.
   - Confirms payout from its own wallet.

In both cases, the human worker is paid by the same Arc escrow contract.

## What Humans Can Do For AI

RentAHuman is for tasks where an AI agent needs a physical body, local presence, real-world judgment, or access to human-only channels.

Examples:

- **Send or receive mail**
  - print and mail a document
  - pick up a letter from a mailbox
  - scan received paper documents
  - verify that a package arrived

- **Local inspection**
  - take photos of a storefront
  - check whether a business is open
  - verify a sign, menu, price, shelf, or event poster
  - inspect an apartment, office, or public location

- **Repair and maintenance**
  - tighten a loose fixture
  - reset a router
  - replace a battery
  - check a leaking pipe
  - document damage with photos before a contractor arrives

- **Errands and delivery**
  - pick up an item
  - deliver a small package
  - buy something locally and upload receipt proof
  - wait in line or check availability in a shop

- **Phone calls and human communication**
  - call a local business
  - ask for availability or pricing
  - schedule an appointment
  - negotiate a simple pickup time
  - confirm details that are not available online

- **Human judgment**
  - compare two real-world options
  - review whether something looks authentic
  - evaluate cleanliness, quality, or condition
  - make a common-sense decision where pure automation is risky

- **Proof collection**
  - upload photos
  - upload video
  - upload receipt images
  - provide GPS/time/context notes
  - submit a written report

The AI agent can create the task, fund escrow, and later verify the proof. The human performs the real-world action.

## Hackathon Demo Story

Example demo:

1. An AI agent needs a real-world storefront check.
2. The agent calls RentAHuman's paid API using x402.
3. The API returns available workers.
4. The agent creates a task: "Take 3 photos of this storefront and upload proof."
5. The agent wallet funds `1 USDC` into escrow on Arc.
6. A human worker opens the dashboard and accepts the task.
7. The worker completes the task and submits proof.
8. The agent retrieves proof through the x402 API.
9. The agent verifies proof off-chain.
10. The agent wallet calls `confirmCompletion`.
11. The smart contract pays:
    - `95%` to the worker
    - `5%` to the marketplace fee wallet

The important point for judges:

> x402 monetizes the agent API. Arc escrow protects the worker payment.

They are separate payment layers working together.

## Live MVP Components

- Browse workers: `/browse`
- Create task: `/tasks/create`
- On-chain dashboard: `/dashboard`
- Manual escrow tools: `/escrow`
- Agent API: `/api/v1/agents/*`
- Agent wallet demo script: `ai-agent-example/agent-wallet-flow.ts`
- Smart contract: `contracts/contracts/EscrowMarketplace.sol`

## Quick Start

```bash
npm install --cache .npm-cache
cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:3000/browse
```

Database is optional for this MVP. Without `DATABASE_URL`, the app uses in-memory/demo data. The smart contract remains the source of truth for escrow state.

## Arc Network

The MVP runs on Arc Testnet.

| Field | Value |
|---|---|
| Network | Arc Testnet |
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| WebSocket | `wss://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |
| USDC ERC-20 | `0x3600000000000000000000000000000000000000` |
| USDC ERC-20 decimals | `6` |

Arc uses USDC as the native gas token, but the ERC-20 USDC interface still uses 6 decimals. The escrow contract always uses ERC-20 USDC amounts with 6 decimals.

Current deployed MVP contract:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x571E3f1301d596f0052861D499E936Dc2621892f
```

Deploy a new contract:

```bash
DEPLOYER_PRIVATE_KEY=0x... \
ARC_RPC_URL=https://rpc.testnet.arc.network \
USDC_CONTRACT_ADDRESS=0x3600000000000000000000000000000000000000 \
FEE_RECIPIENT_ADDRESS=0x... \
npm run contract:deploy:arc
```

After deployment, update `NEXT_PUBLIC_CONTRACT_ADDRESS` locally and in Vercel, then redeploy the app.

## Who Does What

### Human Employer

The human employer is a wallet user who wants work done.

They:

1. Connect wallet.
2. Create a task.
3. Write the task title and description.
4. Choose an amount in USDC.
5. Approve USDC.
6. Fund escrow.
7. Wait for worker proof.
8. Confirm payout or open a dispute.

### Human Worker

The worker is a wallet user who wants to earn USDC.

They:

1. Connect wallet.
2. Open `/dashboard`.
3. Read the task description.
4. Accept an open task.
5. Complete the real-world work.
6. Submit proof.
7. Wait for employer or agent confirmation.
8. Receive USDC from the smart contract.

### AI Agent

The AI agent is an autonomous buyer with its own Arc wallet.

It:

1. Pays x402 to access RentAHuman API endpoints.
2. Searches for workers.
3. Creates a hire request.
4. Receives escrow parameters.
5. Signs USDC `approve`.
6. Signs escrow `createTask`.
7. Later reads worker proof through the API.
8. Verifies proof off-chain.
9. Signs `confirmCompletion`.

The agent private key is not stored in the app. It lives only in the agent runtime.

### Marketplace

The marketplace provides:

- worker discovery
- task metadata
- x402-paid agent API
- smart-contract escrow UI
- fee recipient wallet

The marketplace does not custody worker escrow funds. Escrow funds are held by the smart contract.

## Smart Contract Logic

Contract:

```text
contracts/contracts/EscrowMarketplace.sol
```

The contract controls the real worker payment. It holds USDC until the task reaches a final state.

### Roles In The Contract

- `employer`: wallet that creates and funds the task.
- `executor`: worker wallet that performs the task.
- `owner`: contract owner. Also used as the placeholder executor for open-to-any-worker tasks.
- `feeRecipient`: wallet receiving marketplace fees.

### Task Data

Each task stores:

- `id`: on-chain task ID.
- `employer`: wallet that funded escrow.
- `executor`: worker wallet, or placeholder before acceptance.
- `amount`: USDC amount in 6-decimal atomic units.
- `deadline`: Unix timestamp.
- `status`: lifecycle state.
- `taskHash`: hash of off-chain task metadata.
- `proofHash`: hash of submitted proof.
- `createdAt`: task creation timestamp.
- `completedAt`: finalization timestamp.

The full human-readable task description is stored off-chain and linked by `chainTaskId`. The dashboard combines on-chain data with off-chain metadata so workers can read instructions.

### Statuses

```text
0 Open
1 InProgress
2 ProofSubmitted
3 Completed
4 Disputed
5 Cancelled
6 AutoReleased
```

### Create Task

Function:

```solidity
createTask(address executor, uint256 amount, uint256 deadline, bytes32 taskHash)
```

What happens:

1. Employer approves USDC.
2. Employer calls `createTask`.
3. Contract pulls USDC from employer.
4. Contract stores task data.
5. Task becomes `Open`.

Rules:

- amount must be greater than zero
- deadline must be at least 1 hour in the future
- executor cannot be zero

Open-worker logic:

- If an employer specifies an executor address, only that wallet can accept.
- If the employer leaves executor blank in the UI, the frontend sends `owner()` as a placeholder.
- If executor is `owner()`, any worker wallet can accept.

### Accept Task

Function:

```solidity
acceptTask(uint256 taskId)
```

What happens:

1. Worker clicks `Accept as worker`.
2. Contract checks task is `Open`.
3. If executor is placeholder `owner()`, the contract sets executor to `msg.sender`.
4. If executor is fixed, only that executor can accept.
5. Task becomes `InProgress`.

This is how a random worker can become the executor for an open marketplace task.

### Submit Proof

Function:

```solidity
submitProof(uint256 taskId, bytes32 proofHash)
```

What happens:

1. Worker completes the task.
2. Worker enters a proof note or proof URL.
3. App hashes the proof.
4. Worker submits the proof hash on-chain.
5. Task becomes `ProofSubmitted`.

Only the executor can submit proof.

### Confirm Completion

Function:

```solidity
confirmCompletion(uint256 taskId)
```

What happens:

1. Employer or agent reviews proof.
2. Employer or agent calls `confirmCompletion`.
3. Contract splits escrow.
4. Worker receives `95%`.
5. Fee recipient receives `5%`.
6. Worker reputation increases.
7. Task becomes `Completed`.

Only the employer can confirm.

For a `1 USDC` task:

```text
0.95 USDC -> worker
0.05 USDC -> feeRecipient
```

### Cancel / Refund

Function:

```solidity
cancelOpenTask(uint256 taskId)
```

What happens:

1. Employer cancels an unaccepted task.
2. Full escrow amount returns to employer.
3. Task becomes `Cancelled`.

Only employer can cancel. Task must still be `Open`.

### Dispute

Open dispute:

```solidity
openDispute(uint256 taskId)
```

Resolve dispute:

```solidity
resolveDispute(uint256 taskId, bool favorExecutor)
```

Flow:

1. Worker submits proof.
2. Employer disagrees.
3. Employer opens dispute.
4. Contract owner resolves.

If `favorExecutor = true`:

- worker gets 95%
- fee recipient gets 5%
- task becomes `Completed`

If `favorExecutor = false`:

- employer gets full refund
- task becomes `Cancelled`

### Auto Release

Function:

```solidity
autoRelease(uint256 taskId)
```

If a worker submitted proof and employer disappears, anyone can call auto-release after:

```text
deadline + 24 hours
```

The worker gets paid and the task becomes `AutoReleased`.

## Dashboard Logic

The dashboard is designed for both sides.

It reads directly from the smart contract:

- `nextTaskId()`
- `tasks(taskId)`
- `owner()`

Then it asks the app API for metadata:

```http
GET /api/tasks?chainIds=1,2,3
```

The card shows:

- task ID
- title
- description
- category
- amount
- employer
- executor
- deadline
- status
- role-based buttons

Buttons are only enabled when the connected wallet is allowed to act.

| Button | Who can click | Required status |
|---|---|---|
| Accept as worker | executor or any worker for open task | `Open` |
| Submit proof | executor | `InProgress` |
| Confirm payout | employer | `ProofSubmitted` |
| Cancel / refund | employer | `Open` |
| Open dispute | employer | `ProofSubmitted` |
| Auto release | anyone | `ProofSubmitted`, after deadline grace |

## x402 Logic

x402 is not the worker payment.

x402 is the agent API access payment.

The worker payment happens through Arc escrow.

### Why x402 Is Used

AI agents need machine-native ways to pay for API access. Instead of API subscriptions, dashboards, or credit cards, x402 lets an agent pay per request.

In RentAHuman:

- an agent pays x402 to search humans
- an agent pays x402 to create hire requests
- an agent pays x402 to retrieve proof
- an agent separately funds escrow on Arc to pay the human

### Two Payment Layers

Layer 1: x402 API fee

- paid by agent
- unlocks API endpoint
- goes to `MARKETPLACE_WALLET_ADDRESS`
- does not pay worker

Layer 2: Arc escrow

- funded by employer or agent wallet
- held by smart contract
- pays worker after proof
- pays marketplace fee from escrow

This is the core architecture:

```text
AI Agent
  -> pays x402
  -> gets API access
  -> finds worker
  -> funds Arc escrow
  -> receives proof
  -> confirms payout

Human Worker
  -> accepts task
  -> submits proof
  -> gets paid by contract
```

### x402-Protected Endpoints

When `X402_ENABLED=true`, these endpoints require x402 payment:

| Endpoint | Price | Purpose |
|---|---:|---|
| `GET /api/v1/agents/humans` | `$0.01` | Search workers |
| `POST /api/v1/agents/hire` | `$0.05` | Create hire request |
| `GET /api/v1/agents/tasks/:id` | `$0.005` | Read task |
| `GET /api/v1/agents/tasks/:id/proof` | `$0.005` | Read proof |

When `X402_ENABLED=false`, the same endpoints use bearer auth:

```http
Authorization: Bearer dev-agent-key
```

That is the local/test mode.

### x402 Environment

```env
X402_ENABLED=true
MARKETPLACE_WALLET_ADDRESS=0x...
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_NETWORK=eip155:5042002
```

`MARKETPLACE_WALLET_ADDRESS` receives x402 API fees. It can be the same wallet as `feeRecipient`, but it does not have to be.

## AI Agent Wallet Flow

The AI agent is a real on-chain employer.

The agent has its own funded Arc Testnet wallet. The app does not custody the agent's key.

Agent env:

```env
AGENT_PRIVATE_KEY=0x...
AGENT_ADDRESS=0x...
MARKETPLACE_API_URL=https://humans-for-ai-agent-on-arc.vercel.app
NEXT_PUBLIC_CONTRACT_ADDRESS=0x571E3f1301d596f0052861D499E936Dc2621892f
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
ARC_RPC_URL=https://rpc.testnet.arc.network
TASK_AMOUNT_USDC=1
TASK_DEADLINE_HOURS=24
```

Run the demo agent:

```bash
cd ai-agent-example
cp .env.example .env
npm install
npm run wallet-flow
```

The demo script:

1. Loads `AGENT_PRIVATE_KEY`.
2. Creates an Arc wallet client.
3. Uses x402 fetch if `X402_ENABLED=true`.
4. Uses bearer auth if `X402_ENABLED=false`.
5. Calls `/api/v1/agents/humans`.
6. Calls `/api/v1/agents/hire`.
7. Receives escrow params.
8. Signs USDC `approve`.
9. Signs `createTask`.
10. Reads the `TaskCreated` event.
11. Saves `chainTaskId` back to the app.
12. Later reads proof.
13. Calls `confirmCompletion` if proof is valid.

In this MVP, proof validation is intentionally simple/manual. A production agent could add:

- LLM proof review
- image verification
- receipt parsing
- location checks
- human-in-the-loop review
- risk scoring before payout

## Agent Hire API Example

Request:

```http
POST /api/v1/agents/hire
Authorization: Bearer dev-agent-key
Content-Type: application/json

{
  "agentId": "0xAgentWallet",
  "executorAddress": "0xWorkerWallet",
  "title": "Check storefront",
  "description": "Take 3 clear photos of the storefront and upload proof URL.",
  "amountUsdc": "1",
  "deadlineHours": 24,
  "category": "Research"
}
```

Response:

```json
{
  "task": {
    "id": "app-task-id",
    "title": "Check storefront",
    "chainTaskId": null
  },
  "escrow": {
    "contractAddress": "0x571E3f1301d596f0052861D499E936Dc2621892f",
    "executorAddress": "0xWorkerWallet",
    "amountAtomic": "1000000",
    "deadlineUnix": 1794393600,
    "metadataHash": "0x..."
  },
  "note": "x402 pays only for API access. The agent wallet must fund escrow on-chain with USDC approve + createTask, then confirmCompletion after proof."
}
```

The API prepares the task and returns escrow parameters. It does not move escrow funds. The agent wallet signs the on-chain escrow transaction.

## Demo Script For Judges

Recommended hackathon demo:

1. Show `/browse`: humans available for tasks.
2. Show `/tasks/create`: human employer can create task.
3. Create an open-to-any-worker task with `1 USDC`.
4. Show `/dashboard`: task appears with ID and description.
5. Switch wallet to worker.
6. Worker clicks `Accept as worker`.
7. Worker submits proof.
8. Switch back to employer.
9. Employer clicks `Confirm payout`.
10. Show contract balance is empty for that task.
11. Explain payout: 95% worker, 5% marketplace.
12. Show x402 agent script and explain AI agents can do the employer side programmatically.

## Testing

Smart contract tests:

```bash
npm run contract:test
```

Covered:

- create, accept, proof, confirm payout
- cancel and refund
- self-executor demo
- any-worker open task
- fixed-executor task
- dispute resolution
- auto-release

App checks:

```bash
npx tsc --noEmit
npm run build
```

Agent example typecheck:

```bash
npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --skipLibCheck --types node ai-agent-example/agent-wallet-flow.ts
```

## Important Production Notes

- Do not store `AGENT_PRIVATE_KEY` in the Next.js app unless intentionally building a backend signer.
- Current MVP uses agent-wallet signing, not backend signing.
- x402 fees and escrow payments are separate.
- Configure a real database for persistent task descriptions and proof URLs.
- Old tasks stay on old contracts if `NEXT_PUBLIC_CONTRACT_ADDRESS` changes.
- Dashboard reads only the current configured contract.

Arc mainnet is not hardcoded because this MVP targets Arc Testnet.
