import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-shadow': 'off',
      'import/prefer-default-export': 'off',
      'no-console': 'off',
      'consistent-return': 'off',
      'func-names': 'off',
      '@typescript-eslint/no-shadow': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-types': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'no-underscore-dangle': [
        'error',
        {
          allow: ['_id'],
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  prettier,
]
