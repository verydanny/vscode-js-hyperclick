module.exports = {
  extends: [
    'plugin:@torpedus/typescript',
    'plugin:@torpedus/typescript-tsconfig-checking',
    'plugin:@torpedus/node',
    'plugin:@torpedus/prettier',
  ],
  parserOptions: {
    project: ['tsconfig.json'],
  },
  rules: {
    // ES6
    'promise/no-nesting': 'off',
    'callback-return': 'off',
    'func-style': 'off',
    'require-atomic-updates': 'off',
    'consistent-return': 'off',
    'babel/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
      },
    ],

    // File resolution
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'error',

    // Node
    'node/no-extraneous-require': 'off',

    // TypeScript
    '@typescript-eslint/no-unnecessary-type-arguments': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/prefer-readonly': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/await-thenable': 'off',

    // Prettier (IMPORTANT: Must be last)
    'prettier/prettier': [
      'error',
      {
        arrowParens: 'always',
        bracketSpacing: true,
        singleQuote: true,
        semi: false,
      },
    ],
  },
}
