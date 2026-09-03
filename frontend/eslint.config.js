import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Raw hex colours and pixel literals belong only in the token
    // definition file — everywhere else must reference a CSS custom
    // property (AC1). `src/shared/theme/**` is the one place allowed to
    // hold the literal values these rules would otherwise flag.
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/shared/theme/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message: 'Raw hex colours are not allowed outside src/shared/theme — reference a CSS custom property instead.',
        },
        {
          selector: "Literal[value=/^\\d+px$/]",
          message: 'Raw pixel values are not allowed outside src/shared/theme — reference a CSS custom property instead.',
        },
      ],
    },
  },
)
