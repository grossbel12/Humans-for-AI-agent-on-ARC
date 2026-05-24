import { randomUUID } from "crypto";
import { demoHumans } from "@/lib/demo-data";
import { prisma } from "@/lib/db";

type HumanInput = {
  address: string;
  name: string;
  headline: string;
  bio: string;
  city: string;
  country: string;
  remote: boolean;
  skills: string[];
  categories: string[];
  rateUsd: string;
  available?: boolean;
  avatarUrl?: string | null;
};

type StoredHuman = Omit<HumanInput, "available" | "avatarUrl"> & {
  id: string;
  userId: string;
  available: boolean;
  avatarUrl: string | null;
  rating: string;
  reputation: number;
  jobsDone: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TaskInput = {
  title: string;
  description: string;
  category: string;
  location?: string;
  amountUsdc: string;
  amountAtomic: string;
  deadline: Date;
  metadataHash: string;
  employerAddress: string;
  executorAddress: string;
  agentId?: string;
  txHash?: string;
  chainTaskId?: string;
  contractAddress?: string;
};

type TaskUpdate = {
  status?: string;
  chainTaskId?: string;
  txHash?: string;
  proofUrl?: string;
  proofHash?: string;
};

const memory = globalThis as unknown as {
  rentahuman?: {
    users: Map<string, { id: string; address: string; nonce?: string | null; createdAt: Date; updatedAt: Date }>;
    humans: Map<string, StoredHuman>;
    tasks: Map<string, TaskInput & { id: string; status: string; proofUrl?: string | null; proofHash?: string | null; completedAt?: Date | null; createdAt: Date; updatedAt: Date }>;
  };
};

const db = (memory.rentahuman ??= {
  users: new Map(),
  humans: new Map(demoHumans.map((human) => [human.address.toLowerCase(), human as StoredHuman])),
  tasks: new Map()
});

const hasDatabase = Boolean(process.env.DATABASE_URL);

export const databaseEnabled = hasDatabase;

function user(address: string) {
  const key = address.toLowerCase();
  const existing = db.users.get(key);
  if (existing) return existing;
  const now = new Date();
  const created = { id: randomUUID(), address: key, createdAt: now, updatedAt: now };
  db.users.set(key, created);
  return created;
}

export async function setNonce(address: string, nonce: string) {
  const normalized = address.toLowerCase();
  if (hasDatabase) {
    await prisma.user.upsert({
      where: { address: normalized },
      update: { nonce },
      create: { address: normalized, nonce }
    });
    return;
  }

  const saved = user(normalized);
  db.users.set(normalized, { ...saved, nonce, updatedAt: new Date() });
}

export async function consumeNonce(address: string, nonce: string) {
  const normalized = address.toLowerCase();
  if (hasDatabase) {
    const savedUser = await prisma.user.findUnique({ where: { address: normalized } });
    if (!savedUser || savedUser.nonce !== nonce) return false;
    await prisma.user.update({ where: { address: normalized }, data: { nonce: null } });
    return true;
  }

  const savedUser = db.users.get(normalized);
  if (!savedUser || savedUser.nonce !== nonce) return false;
  db.users.set(normalized, { ...savedUser, nonce: null, updatedAt: new Date() });
  return true;
}

function humanMatches(human: { city: string; skills: string[]; categories: string[]; rateUsd: unknown; available: boolean }, filters: { city?: string | null; skill?: string | null; category?: string | null; maxRate?: string | null }) {
  if (!human.available) return false;
  if (filters.city && !human.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
  if (filters.skill && !human.skills.map((skill) => skill.toLowerCase()).includes(filters.skill.toLowerCase())) return false;
  if (filters.category && !human.categories.map((category) => category.toLowerCase()).includes(filters.category.toLowerCase())) return false;
  if (filters.maxRate && Number(human.rateUsd) > Number(filters.maxRate)) return false;
  return true;
}

export async function listHumans(filters: { city?: string | null; skill?: string | null; category?: string | null; maxRate?: string | null; limit?: number }) {
  if (hasDatabase) {
    return prisma.humanProfile.findMany({
      where: {
        available: true,
        ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
        ...(filters.skill ? { skills: { has: filters.skill } } : {}),
        ...(filters.category ? { categories: { has: filters.category } } : {}),
        ...(filters.maxRate ? { rateUsd: { lte: filters.maxRate } } : {})
      },
      orderBy: [{ verified: "desc" }, { reputation: "desc" }, { rateUsd: "asc" }],
      take: filters.limit ?? 24
    });
  }

  return [...db.humans.values()]
    .filter((human) => humanMatches(human, filters))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.reputation - a.reputation || Number(a.rateUsd) - Number(b.rateUsd))
    .slice(0, filters.limit ?? 24);
}

export async function getHuman(address: string) {
  if (hasDatabase) return prisma.humanProfile.findUnique({ where: { address: address.toLowerCase() } });
  return db.humans.get(address.toLowerCase()) ?? null;
}

export async function upsertHuman(input: HumanInput) {
  const address = input.address.toLowerCase();
  if (hasDatabase) {
    const savedUser = await prisma.user.upsert({ where: { address }, update: {}, create: { address } });
    return prisma.humanProfile.upsert({
      where: { address },
      update: { ...input, address, rateUsd: String(input.rateUsd), available: input.available ?? true, avatarUrl: input.avatarUrl || null },
      create: { ...input, address, userId: savedUser.id, rateUsd: String(input.rateUsd), avatarUrl: input.avatarUrl || null }
    });
  }

  const savedUser = user(address);
  const now = new Date();
  const profile = {
    id: db.humans.get(address)?.id ?? randomUUID(),
    userId: savedUser.id,
    ...input,
    address,
    available: input.available ?? true,
    avatarUrl: input.avatarUrl || null,
    rating: db.humans.get(address)?.rating ?? "0",
    reputation: db.humans.get(address)?.reputation ?? 0,
    jobsDone: db.humans.get(address)?.jobsDone ?? 0,
    verified: db.humans.get(address)?.verified ?? false,
    createdAt: db.humans.get(address)?.createdAt ?? now,
    updatedAt: now
  };
  db.humans.set(address, profile);
  return profile;
}

export async function createTask(input: TaskInput) {
  if (hasDatabase) {
    await prisma.user.upsert({ where: { address: input.employerAddress }, update: {}, create: { address: input.employerAddress } });
    await prisma.user.upsert({ where: { address: input.executorAddress }, update: {}, create: { address: input.executorAddress } });
    return prisma.task.create({ data: input });
  }

  user(input.employerAddress);
  user(input.executorAddress);
  const now = new Date();
  const task = { id: randomUUID(), ...input, status: "Open", proofUrl: null, proofHash: null, completedAt: null, createdAt: now, updatedAt: now };
  db.tasks.set(task.id, task);
  return task;
}

export async function listTasks(filters: { address?: string | null; limit?: number } = {}) {
  if (hasDatabase) {
    return prisma.task.findMany({
      where: filters.address ? { OR: [{ employerAddress: filters.address }, { executorAddress: filters.address }] } : {},
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 50
    });
  }

  const address = filters.address?.toLowerCase();
  return [...db.tasks.values()]
    .filter((task) => !address || task.employerAddress === address || task.executorAddress === address)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, filters.limit ?? 50);
}

export async function listTaskMetadataByChainIds(chainTaskIds: string[]) {
  const ids = [...new Set(chainTaskIds.filter(Boolean))];
  if (!ids.length) return [];

  if (hasDatabase) {
    return prisma.task.findMany({
      where: { chainTaskId: { in: ids } },
      select: {
        id: true,
        chainTaskId: true,
        title: true,
        description: true,
        category: true,
        location: true,
        txHash: true
      }
    });
  }

  return [...db.tasks.values()]
    .filter((task) => task.chainTaskId && ids.includes(task.chainTaskId))
    .map((task) => ({
      id: task.id,
      chainTaskId: task.chainTaskId,
      title: task.title,
      description: task.description,
      category: task.category,
      location: task.location ?? null,
      txHash: task.txHash ?? null
    }));
}

export async function getTask(id: string) {
  if (hasDatabase) return prisma.task.findUnique({ where: { id } });
  return db.tasks.get(id) ?? null;
}

export async function updateTask(id: string, input: TaskUpdate) {
  if (hasDatabase) {
    return prisma.task.update({
      where: { id },
      data: {
        status: input.status as never,
        chainTaskId: input.chainTaskId,
        txHash: input.txHash,
        proofUrl: input.proofUrl,
        proofHash: input.proofHash,
        completedAt: input.status && ["Completed", "Cancelled", "AutoReleased"].includes(input.status) ? new Date() : undefined
      }
    });
  }

  const task = db.tasks.get(id);
  if (!task) return null;
  const next = {
    ...task,
    ...input,
    completedAt: input.status && ["Completed", "Cancelled", "AutoReleased"].includes(input.status) ? new Date() : task.completedAt,
    updatedAt: new Date()
  };
  db.tasks.set(id, next);
  return next;
}
