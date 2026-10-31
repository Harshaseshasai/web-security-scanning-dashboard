import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'
import a11y from 'eslint-plugin-jsx-a11y'

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'public/**', '.agents/**', 'src/vite-env.d.ts'] },
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { react, 'react-hooks': hooks, 'jsx-a11y': a11y },
    settings: { react: { version: '18.3' } },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        { allowString: true, allowNumber: true, allowNullableBoolean: true },
      ],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/aria-props': 'error',
    },
  },
  {
    files: ['src/test/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  }
)
