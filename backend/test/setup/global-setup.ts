import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';

import { testDatabaseUrl } from './test-env';

/**
 * Один раз перед всеми e2e-тестами: создаёт тестовую базу (если её нет)
 * и применяет к ней миграции.
 */
export default async function globalSetup(): Promise<void> {
  const testUrl = new URL(testDatabaseUrl());
  const dbName = testUrl.pathname.slice(1);
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = '/postgres';

  const admin = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  try {
    const exists = await admin.$queryRaw<unknown[]>`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
    if (exists.length === 0) await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    cwd: resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
    stdio: 'ignore',
  });
}
