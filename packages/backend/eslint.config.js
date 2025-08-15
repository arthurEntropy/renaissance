import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module', // ES modules for backend
      globals: {
        ...globals.node
      }
    },
    rules: {
      // Enforce clean code practices
      'no-unused-vars': ['error', { 
        'varsIgnorePattern': '^_',
        'argsIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }],
      'no-empty': ['error', { 'allowEmptyCatch': true }],
      
      // TODO: BEFORE PRODUCTION - Change 'no-console' to 'error' and implement proper logging
      // For now, allow console statements during development to avoid cluttering output
      'no-console': 'off', // Change to 'error' before production deployment
      
      'no-debugger': 'error'
    }
  }
]
