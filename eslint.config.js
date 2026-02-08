import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/'] },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended (type-aware off — too slow for large codebases in editor)
  ...tseslint.configs.recommended,

  // React hooks
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // React Refresh (Vite HMR)
  {
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Project-wide overrides
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript's compiler already checks these — no need to double-report
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],

      // Allow `any` for now — too many to fix in one pass
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow empty functions (common in React callbacks)
      '@typescript-eslint/no-empty-function': 'off',

      // Global mutable state is mutated through props — will be fixed with TODO #1 (Zustand migration)
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',

      // Downgrade set-state-in-effect — common pattern for "run on mount" hooks
      'react-hooks/set-state-in-effect': 'warn',

      // Require const over let when variable is never reassigned
      'prefer-const': 'warn',

      // No console.log in production (warn, not error — useful during dev)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Relax rules for test and demo files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.demo.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
);
