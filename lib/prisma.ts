import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

export type DbTarget = 'cloud' | 'local';

export function getActiveDb(): DbTarget {
  try {
    const configPath = path.join(process.cwd(), 'db-config.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    console.log('[prisma] db-config.json =', raw.trim());
    return config.activeDb === 'local' ? 'local' : 'cloud';
  } catch (e) {
    console.log('[prisma] failed to read db-config.json:', e);
    return (process.env.ACTIVE_DB as DbTarget) ?? 'cloud';
  }
}

function getDbUrl(db: DbTarget): string {
  if (db === 'local') {
    const url = process.env.LOCAL_DATABASE_URL;
    console.log('[prisma] getDbUrl(local):', url ? url.substring(0, 45) + '...' : 'UNDEFINED');
    if (!url) throw new Error('LOCAL_DATABASE_URL is not set in .env');
    return url;
  }
  const url = process.env.DATABASE_URL;
  console.log('[prisma] getDbUrl(cloud):', url ? url.substring(0, 45) + '...' : 'UNDEFINED');
  if (!url) throw new Error('DATABASE_URL is not set in .env');
  return url;
}

function createClient(db: DbTarget): PrismaClient {
  const url = getDbUrl(db);
  console.log('[prisma] creating client for:', db);
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

// Cache keyed by DB target
const globalForPrisma = globalThis as unknown as {
  prismaClients?: Map<DbTarget, PrismaClient>;
};

export function getClient(db?: DbTarget): PrismaClient {
  const target = db ?? getActiveDb();
  console.log('[prisma] getClient target =', target);
  if (!globalForPrisma.prismaClients) {
    globalForPrisma.prismaClients = new Map();
  }
  if (!globalForPrisma.prismaClients.has(target)) {
    globalForPrisma.prismaClients.set(target, createClient(target));
  }
  return globalForPrisma.prismaClients.get(target)!;
}

// Proxy that always delegates to the currently active DB client
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    const client = getClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  },
});

export default prisma;
