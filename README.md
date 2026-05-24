# RentAHuman Arc MVP

RentAHuman is a wallet-native marketplace where humans do real-world tasks for USDC and AI agents can hire them through a paid API. The MVP runs on Arc Testnet. Worker payments are held in a smart-contract escrow; x402 is used only to charge agents for API access.

## Quick Start

```bash
npm install --cache .npm-cache
cp .env.example .env
npm run dev
```

Open:

- Human marketplace: `http://localhost:3000/browse`
- Create task: `http://localhost:3000/tasks/create`
- On-chain task dashboard: `http://localhost:3000/dashboard`
- Manual escrow tools: `http://localhost:3000/escrow`

Database is optional for the MVP. If `DATABASE_URL` is missing, the app falls back to in-memory/demo data. On-chain tasks still work because the source of truth for escrow state is the Arc smart contract.

## Arc Network

- Network: Arc Testnet
- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- WebSocket: `wss://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Faucet: `https://faucet.circle.com`
- USDC ERC-20 interface: `0x3600000000000000000000000000000000000000`
- USDC ERC-20 decimals: `6`

Important: Arc native gas accounting uses 18 decimals internally, but the ERC-20 USDC interface uses 6 decimals. The escrow contract always uses ERC-20 USDC amounts with 6 decimals.

Current deployed marketplace contract used in the MVP:

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

Copy the deployed address into `NEXT_PUBLIC_CONTRACT_ADDRESS` locally and in Vercel, then redeploy the app.

## Smart Contract Logic

Contract: `contracts/contracts/EscrowMarketplace.sol`

The contract holds USDC in escrow until a task is cancelled, completed, disputed, or auto-released.

### Roles

- `employer`: the wallet that creates and funds a task. This can be a human or an AI agent wallet.
- `executor`: the worker wallet that performs the task.
- `owner`: the contract owner. In this MVP, the owner is also used as a placeholder executor for open-to-any-worker tasks.
- `feeRecipient`: wallet receiving marketplace fees.

### Task Fields

Each on-chain task stores:

- `id`: sequential on-chain task ID.
- `employer`: wallet that funded escrow.
- `executor`: fixed worker wallet, or `owner()` as the placeholder for "open to any worker".
- `amount`: USDC amount in atomic 6-decimal units.
- `deadline`: Unix timestamp.
- `status`: task lifecycle status.
- `taskHash`: bytes32 hash of off-chain task metadata.
- `proofHash`: bytes32 hash of worker proof.
- `createdAt`: creation timestamp.
- `completedAt`: finalization timestamp.

Task title, description, category, and location are stored off-chain in the app/API and linked by `chainTaskId`. The dashboard reads both on-chain state and off-chain metadata so workers can see what to do.

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

Rules:

- `executor` cannot be zero.
- `amount` must be greater than zero.
- `deadline` must be at least 1 hour in the future.
- Employer must approve USDC first.
- Contract pulls USDC from `msg.sender` using `safeTransferFrom`.
- New task status is `Open`.

Frontend behavior:

- If employer fills executor address, task is locked to that executor.
- If employer leaves executor blank, frontend sends `owner()` as placeholder.
- Placeholder means any wallet can accept the task and become executor.

### Accept Task

Function:

```solidity
acceptTask(uint256 taskId)
```

Rules:

- Task must be `Open`.
- If `task.executor == owner()`, any wallet can accept.
- When any wallet accepts an open-to-any-worker task, the contract sets `task.executor = msg.sender`.
- If executor was fixed at creation, only that executor wallet can accept.
- Status becomes `InProgress`.

This is the main MVP worker flow: a worker opens `/dashboard`, finds an open task, clicks `Accept as worker`, and becomes the on-chain executor.

### Submit Proof

Function:

```solidity
submitProof(uint256 taskId, bytes32 proofHash)
```

Rules:

- Task must be `InProgress`.
- Only the executor can submit proof.
- Contract saves `proofHash`.
- Status becomes `ProofSubmitted`.

The UI lets the worker type a proof note or URL. The app hashes it and submits the hash on-chain. Off-chain proof text/URL can also be stored by the app/API.

### Confirm Completion

Function:

```solidity
confirmCompletion(uint256 taskId)
```

Rules:

- Task must be `ProofSubmitted`.
- Only the employer can confirm.
- Contract pays the executor and fee recipient.
- Executor reputation increases by `10`.
- Status becomes `Completed`.

Payment split:

- Worker/executor receives `95%`.
- Marketplace `feeRecipient` receives `5%`.

The default fee is:

```solidity
protocolFeeBps = 500
```

`500 bps = 5%`.

Example for a `1 USDC` task:

- executor receives `0.95 USDC`
- feeRecipient receives `0.05 USDC`
- escrow contract balance returns to `0` for that task

### Cancel / Refund

Function:

```solidity
cancelOpenTask(uint256 taskId)
```

Rules:

- Task must be `Open`.
- Only employer can cancel.
- Full escrow amount returns to employer.
- Status becomes `Cancelled`.

Cancel is not available after the task is accepted. After `InProgress`, the flow must go through proof, confirmation, dispute, or later protocol extensions.

### Open Dispute

Function:

```solidity
openDispute(uint256 taskId)
```

Rules:

- Task must be `ProofSubmitted`.
- Only employer can open dispute.
- Status becomes `Disputed`.

Dispute is for cases where worker submitted proof but employer does not want to pay.

### Resolve Dispute

Function:

```solidity
resolveDispute(uint256 taskId, bool favorExecutor)
```

Rules:

- Only contract owner can resolve.
- Task must be `Disputed`.

If `favorExecutor = true`:

- Task becomes `Completed`.
- Executor gets 95%.
- Fee recipient gets 5%.
- Executor reputation increases by 10.

If `favorExecutor = false`:

- Task becomes `Cancelled`.
- Employer gets full refund.

### Auto Release

Function:

```solidity
autoRelease(uint256 taskId)
```

Rules:

- Task must be `ProofSubmitted`.
- Anyone can call it.
- It can only run after `deadline + 24 hours`.
- It pays executor 95% and fee recipient 5%.
- Status becomes `AutoReleased`.

This protects workers if employer disappears after proof is submitted.

### Admin Functions

```solidity
setFeeRecipient(address nextFeeRecipient)
setProtocolFeeBps(uint256 nextFeeBps)
```

Rules:

- Only contract owner can call.
- Fee recipient cannot be zero.
- Protocol fee cannot exceed `1000 bps` / `10%`.

## Human UI Flow

### Employer

1. Connect wallet.
2. Open `/tasks/create`.
3. Fill:
   - executor address, or leave blank for any worker
   - task title
   - task description / instructions
   - category
   - location
   - USDC amount
   - deadline
4. Click `Fund escrow`.
5. Wallet approves USDC.
6. Wallet creates escrow task on Arc.
7. Task appears on `/dashboard` with on-chain ID and description.
8. After worker submits proof, employer clicks `Confirm payout`.

### Worker

1. Connect wallet.
2. Open `/dashboard`.
3. Read task title and description.
4. If task says `Open to any worker`, click `Accept as worker`.
5. Complete real-world task.
6. Enter proof note or URL.
7. Click `Submit proof`.
8. Wait for employer confirmation or auto-release.

## Dashboard Logic

`/dashboard` is on-chain first.

It reads:

- `nextTaskId()`
- `tasks(taskId)`
- `owner()`

It also calls:

```http
GET /api/tasks?chainIds=1,2,3
```

to attach off-chain task metadata:

- title
- description
- category
- location
- app task ID

Buttons are disabled unless the connected wallet and task status allow the action:

- `Accept as worker`: task is `Open` and either open to any worker or connected wallet is fixed executor.
- `Submit proof`: task is `InProgress` and connected wallet is executor.
- `Confirm payout`: task is `ProofSubmitted` and connected wallet is employer.
- `Cancel / refund`: task is `Open` and connected wallet is employer.
- `Open dispute`: task is `ProofSubmitted` and connected wallet is employer.
- `Auto release`: task is `ProofSubmitted`; the contract itself enforces the time rule.

## x402 Logic

x402 is used for paid API access by AI agents. It does not replace escrow and does not pay the human worker.

There are two payment layers:

1. x402 API fee
   - paid to `MARKETPLACE_WALLET_ADDRESS`
   - unlocks API endpoints for the agent
   - example: pay to search humans or retrieve proof

2. Arc escrow payment
   - paid by the agent wallet into `EscrowMarketplace`
   - held until proof and confirmation
   - pays worker 95% and marketplace fee 5%

This separation is intentional. x402 monetizes agent access to the marketplace API. The smart contract protects the worker payment.

### Protected Agent Endpoints

When `X402_ENABLED=true`, these endpoints require x402 payment:

- `GET /api/v1/agents/humans`
  - price: `$0.01`
  - purpose: search available workers

- `POST /api/v1/agents/hire`
  - price: `$0.05`
  - purpose: create app-side hire request and receive escrow parameters

- `GET /api/v1/agents/tasks/:id`
  - price: `$0.005`
  - purpose: inspect task state

- `GET /api/v1/agents/tasks/:id/proof`
  - price: `$0.005`
  - purpose: retrieve proof URL/hash/status

When `X402_ENABLED=false`, the same endpoints use bearer auth:

```http
Authorization: Bearer dev-agent-key
```

This is the MVP/test mode.

### x402 Environment

```env
X402_ENABLED=true
MARKETPLACE_WALLET_ADDRESS=0x...
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_NETWORK=eip155:5042002
```

`MARKETPLACE_WALLET_ADDRESS` receives the x402 API fees. It can be the same as the smart contract `feeRecipient`, but it is a separate concept.

## Agent Wallet Flow

The agent is an autonomous buyer. It has its own funded Arc Testnet wallet.

The app never stores the agent private key. The key lives only in the agent runtime, for example in `ai-agent-example/.env`.

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

Run:

```bash
cd ai-agent-example
cp .env.example .env
npm install
npm run wallet-flow
```

What `agent-wallet-flow.ts` does:

1. Creates an agent wallet from `AGENT_PRIVATE_KEY`.
2. Uses x402 paid fetch if `X402_ENABLED=true`.
3. Uses bearer auth if `X402_ENABLED=false`.
4. Calls `/api/v1/agents/humans` to find workers.
5. Calls `/api/v1/agents/hire` to create a hire request.
6. Receives escrow params:
   - `contractAddress`
   - `executorAddress`
   - `amountAtomic`
   - `deadlineUnix`
   - `metadataHash`
7. Signs USDC `approve(contractAddress, amountAtomic)`.
8. Signs `createTask(executorAddress, amountAtomic, deadlineUnix, metadataHash)`.
9. Reads `TaskCreated` event to get `chainTaskId`.
10. Updates app task with `chainTaskId`.
11. Later reads proof through `/api/v1/agents/tasks/:id/proof`.
12. If proof is valid, signs `confirmCompletion(chainTaskId)`.

In this MVP, proof validation is manual/simple. A production agent can plug in an LLM, vision model, geolocation check, receipt parser, or custom verifier before calling `confirmCompletion`.

## Agent Hiring Example

Agent creates a task:

```http
POST /api/v1/agents/hire
Authorization: Bearer dev-agent-key
Content-Type: application/json

{
  "agentId": "0xAgentWallet",
  "executorAddress": "0xWorkerWallet",
  "title": "Check storefront",
  "description": "Take 3 photos of the storefront and upload proof URL.",
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
    "chainTaskId": null,
    "title": "Check storefront"
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

The agent must then fund escrow on-chain. The API does not move escrow funds.

## Testing

Smart contract tests:

```bash
npm run contract:test
```

Covered scenarios:

- create, accept, proof, confirm payout
- cancel open task and refund
- self-executor demo task
- any-worker accepts owner-placeholder task
- fixed executor cannot be accepted by another wallet
- dispute resolved for employer
- auto release after deadline grace window

App checks:

```bash
npx tsc --noEmit
npm run build
```

Agent example typecheck:

```bash
npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --skipLibCheck --types node ai-agent-example/agent-wallet-flow.ts
```

## Production Notes

- Do not store `AGENT_PRIVATE_KEY` in the Next.js app or Vercel server env unless you intentionally build a backend signer.
- The current MVP uses agent-wallet signing, not backend signing.
- x402 fees and escrow payments are separate.
- If `DATABASE_URL` is not configured, off-chain metadata is volatile. Configure Postgres for persistent task descriptions and proof URLs.
- Old tasks stay on the old contract if `NEXT_PUBLIC_CONTRACT_ADDRESS` changes. The dashboard only reads the current configured contract.

Arc mainnet is not hardcoded because current Arc docs expose testnet only.
