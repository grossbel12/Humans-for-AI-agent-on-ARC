CREATE TYPE "TaskStatus" AS ENUM ('Open', 'InProgress', 'ProofSubmitted', 'Completed', 'Disputed', 'Cancelled', 'AutoReleased');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "nonce" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HumanProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "headline" TEXT NOT NULL,
  "bio" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "remote" BOOLEAN NOT NULL DEFAULT false,
  "skills" TEXT[],
  "categories" TEXT[],
  "rateUsd" DECIMAL(12,2) NOT NULL,
  "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
  "reputation" INTEGER NOT NULL DEFAULT 0,
  "jobsDone" INTEGER NOT NULL DEFAULT 0,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HumanProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "chainTaskId" TEXT,
  "contractAddress" TEXT,
  "txHash" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "location" TEXT,
  "amountUsdc" DECIMAL(18,6) NOT NULL,
  "amountAtomic" TEXT NOT NULL,
  "deadline" TIMESTAMP(3) NOT NULL,
  "status" "TaskStatus" NOT NULL DEFAULT 'Open',
  "metadataHash" TEXT NOT NULL,
  "proofHash" TEXT,
  "proofUrl" TEXT,
  "employerAddress" TEXT NOT NULL,
  "executorAddress" TEXT NOT NULL,
  "agentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentReceipt" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT,
  "taskId" TEXT,
  "route" TEXT NOT NULL,
  "amount" TEXT NOT NULL,
  "network" TEXT NOT NULL,
  "payer" TEXT,
  "txHash" TEXT,
  "raw" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_address_key" ON "User"("address");
CREATE UNIQUE INDEX "HumanProfile_userId_key" ON "HumanProfile"("userId");
CREATE UNIQUE INDEX "HumanProfile_address_key" ON "HumanProfile"("address");
CREATE UNIQUE INDEX "PaymentReceipt_paymentId_key" ON "PaymentReceipt"("paymentId");

ALTER TABLE "HumanProfile" ADD CONSTRAINT "HumanProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_employerAddress_fkey" FOREIGN KEY ("employerAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_executorAddress_fkey" FOREIGN KEY ("executorAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
