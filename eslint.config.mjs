import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.e2e.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      // Los archivos de declaracion ambiental deben quedar fuera del sistema de modulos,
      // por eso usan tipos `import('...')` inline en lugar de imports de nivel superior.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    files: ['vite.config.ts', 'playwright.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
{
    // `scripts/*.mjs` corre en Node pero usa APIs de navegador (`customElements`),
    // porque el script de verificacion de HU-SHELL-006 se ejecuta dentro de la
    // pagina con Playwright. Necesita ambos conjuntos de globals.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    // E5: los specs de Playwright y el smoke test corren en Node contra servidores aparte.
    files: ['e2e/**/*.ts', 'smoke/**/*.tsx'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);