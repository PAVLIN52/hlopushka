/** Общие настройки трансформации TypeScript и алиасов для всех проектов Jest. */
const base = {
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@hlopushka/shared$': '<rootDir>/../shared/src',
  },
  testEnvironment: 'node',
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // Юнит-тесты ООП-ядра: без БД и сети (принцип I).
    { ...base, displayName: 'core', rootDir: __dirname, testMatch: ['<rootDir>/src/core/**/*.spec.ts'] },
    // Юнит-тесты модулей (доменные классы и т.п.), тоже без БД.
    { ...base, displayName: 'unit', rootDir: __dirname, testMatch: ['<rootDir>/src/modules/**/*.spec.ts'] },
    // Интеграционные тесты с тестовой БД PostgreSQL.
    { ...base, displayName: 'e2e', rootDir: __dirname, testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'] },
  ],
};
