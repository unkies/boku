import js from '@eslint/js';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importXPlugin from 'eslint-plugin-import-x';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/pkg/**',
      '**/node_modules/**',
      'bun.lock',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importXPlugin.flatConfigs.typescript,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ alwaysTryTypes: true }),
      ],
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      'max-lines-per-function': ['error', { max: 120 }],
      'max-params': ['error', { max: 3 }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'import-x/no-default-export': 'error',
      'import-x/first': 'error',
      'no-restricted-syntax': [
        'error',
        {
          message:
            'Banned `exit` function. Please exit execution through return statements so as to not skip telemetry.',
          selector: 'MemberExpression > Identifier[name="exit"]',
        },
      ],
    },
  },
  prettierConfig
);
