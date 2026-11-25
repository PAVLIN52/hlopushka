import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Окружение e2e-тестов: корневой .env + отдельная база `<имя>_test`,
 * чтобы тесты не трогали данные разработки.
 */
export function testDatabaseUrl(): string {
  const envFile = resolve(__dirname, '../../../.env');
  if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  const url = new URL(process.env.DATABASE_URL ?? 'postgresql://hlopushka:hlopushka@localhost:5432/hlopushka');
  url.pathname = `${url.pathname.replace(/_test$/, '')}_test`;
  return url.toString();
}

/** Применяется в каждом тестовом файле (setupFiles) до импорта приложения. */
export function applyTestEnv(): void {
  const databaseUrl = testDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-0123456789abcdefghijkl';
  process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-0123456789abcdefghijk';
  process.env.NODE_ENV = 'test';
}
