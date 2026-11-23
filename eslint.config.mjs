// Общая конфигурация ESLint для backend и shared (frontend имеет свою, см. frontend/eslint.config.mjs).
// Порядок импортов и запрет обратных зависимостей — принцип VIII конституции.
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/** Группы импортов: сторонние → shared → core → infrastructure/common → modules → относительные. */
export const importOrderRule = [
  'error',
  {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    pathGroups: [
      { pattern: '@hlopushka/shared', group: 'external', position: 'after' },
      { pattern: '@/core/**', group: 'internal', position: 'before' },
      { pattern: '@/{infrastructure,common,config}/**', group: 'internal' },
      { pattern: '@/modules/**', group: 'internal', position: 'after' },
    ],
    pathGroupsExcludedImportTypes: ['builtin'],
    distinctGroup: true,
    'newlines-between': 'always',
    alphabetize: { order: 'asc', caseInsensitive: true },
  },
];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.min.js',
      'frontend/**',
      '.specify/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['backend/**/*.ts', 'shared/**/*.ts'],
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': { typescript: { project: ['backend/tsconfig.json', 'shared/tsconfig.json'], noWarnOnMultipleProjects: true } },
    },
    rules: {
      'import/order': importOrderRule,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Принцип I: ООП-ядро не зависит от фреймворков, инфраструктуры и модулей.
    files: ['backend/src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@nestjs/*'], message: 'Ядро не должно зависеть от NestJS (принцип I).' },
            { group: ['@prisma/*', '.prisma/*'], message: 'Ядро не должно зависеть от Prisma (принцип I).' },
            { group: ['socket.io', 'socket.io-client'], message: 'Ядро не должно зависеть от Socket.IO (принцип I).' },
            { group: ['@/modules/*', '@/infrastructure/*', '@/common/*'], message: 'Обратные импорты из core запрещены (принцип VIII).' },
          ],
        },
      ],
    },
  },
  prettier,
);
