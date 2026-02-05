import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier/flat';

export default tseslint.config(
  // ---------------------------------------------------------------
  // Global ignores
  // ---------------------------------------------------------------
  {
    ignores: [
      'dist',
      'coverage',
      '*.config.{js,ts}',
      'postcss.config.js',
      'tailwind.config.js',
      '*.d.ts',
    ],
  },

  // ---------------------------------------------------------------
  // Base rules
  // ---------------------------------------------------------------
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  jsxA11y.flatConfigs.recommended,

  // ---------------------------------------------------------------
  // Main: TypeScript + React files
  // ---------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Console — warn on console.log, allow console.error/warn
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Enforce `import type { Foo }` for type-only imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Enforce `export type { Foo }` for type-only exports
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],

      // Allow _unused variables (common in destructuring, callbacks)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // getElementById('root')! is a standard React pattern
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Allow numbers and booleans in template literals
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],

      // Allow `void someAsyncFn()` for fire-and-forget in event handlers
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],

      // Empty functions are common as default props and test stubs
      '@typescript-eslint/no-empty-function': 'off',

      // Prefer ?? over || for safer nullish defaults
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    },
  },

  // ---------------------------------------------------------------
  // Test files — relax strict type rules
  // ---------------------------------------------------------------
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
      '**/mocks/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      'no-console': 'off',
    },
  },

  // ---------------------------------------------------------------
  // Prettier — MUST be last to disable conflicting format rules
  // ---------------------------------------------------------------
  prettierConfig,
);
