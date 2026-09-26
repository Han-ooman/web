import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['build', 'dist', 'node_modules', '.react-router'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Pentest BH-10: `target="_blank"` tanpa `rel="noopener"` membuka
      // `window.opener` ke tab github.com. Aturan ini menjaga agar link
      // eksternal berikutnya tidak mengulang kesalahan yang sama.
      'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
    },
  },
  {
    files: ['vite.config.ts', 'react-router.config.ts', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
