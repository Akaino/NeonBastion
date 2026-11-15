// ESLint für Neon Bastion. Das Spiel (src/js) sind Module für den Browser, die Simulation (sim) läuft in Node.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'docs/**', 'node_modules/**', 'tests/out/**'] },
  js.configs.recommended,
  {
    files: ['src/js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser } },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['sim/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-empty': ['warn', { allowEmptyCatch: true }] },
  },
];
