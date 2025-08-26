import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import parser from 'vue-eslint-parser'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    languageOptions: {
      parser: parser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { 
        'varsIgnorePattern': '^_',
        'argsIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }],
      'vue/no-unused-components': 'error',
      'no-empty': ['error', { 'allowEmptyCatch': true }],
      
      // TODO: BEFORE PRODUCTION - Change 'no-console' to 'error' and implement proper logging
      // For now, allow console statements during development to avoid cluttering output
      'no-console': 'off', // Change to 'error' before production deployment
      
      'no-debugger': 'error'
    }
  }
]
