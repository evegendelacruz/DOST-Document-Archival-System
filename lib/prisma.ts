import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

type DbType = 'cloud' | 'local';

interface PrismaCache {
  cloud?: PrismaClient;
  local?: PrismaClient;
}

const globalForPrisma = globalThis as unknown as { prismaCache: PrismaCache };

if (!globalForPrisma.prismaCache) {
  globalForPrisma.prismaCache = {};
}

function getActiveDb(): DbType {
  try {
    const configPath = path.join(process.cwd(), 'db-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.activeDb === 'local' ? 'local' : 'cloud';
  } catch {
    return (process.env.ACTIVE_DB as DbType) || 'cloud';
  }
}

function getClient(db: DbType): PrismaClient {
  const cache = globalForPrisma.prismaCache;
  if (!cache[db]) {
    const url = db === 'local' ? process.env.LOCAL_DATABASE_URL! : process.env.DATABASE_URL!;
    const adapter = new PrismaPg({ connectionString: url });
    cache[db] = new PrismaClient({ adapter });
  }
  return cache[db]!;
}

// Proxy that reads db-config.json on every property access so switching DBs
// at runtime (via Settings) takes effect immediately without a server restart.
const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient(getActiveDb());
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export const prisma = prismaProxy;
export default prisma;
