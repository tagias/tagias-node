module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true
  },
  plugins: [
    'jsdoc'
  ],
  extends: [
    'eslint:recommended',
    'standard',
    'plugin:jsdoc/recommended'
  ],
  parserOptions: {
    ecmaVersion: 11
  },
  rules: {
    'no-async-promise-executor': ['error'],
    'no-await-in-loop': ['error'],
    'no-extra-parens': ['error'],
    'no-misleading-character-class': ['error'],
    'no-template-curly-in-string': ['error'],
    'no-underscore-dangle': 0,
    'no-console': 0,
    'no-plusplus': ['error', {
      allowForLoopAfterthoughts: true
    }],
    semi: [2, 'always'],
    'space-before-function-paren': 0,
    'require-atomic-updates': ['error'],
    'accessor-pairs': ['error'],
    'class-methods-use-this': ['error'],
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    'comma-dangle': ['error', 'never'],
    'require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: true,
        FunctionExpression: true
      }
    }],
    'valid-jsdoc': ['off']
  }
};
