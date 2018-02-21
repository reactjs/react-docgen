module.exports = {
  parser: 'babel-eslint',
  extends: 'eslint:recommended',
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'no-underscore-dangle': 'off',
    quotes: ['error', 'single', 'avoid-escape'],
    strict: 'off',
    'no-unused-vars': 'error',
    'no-undef': 'error'
  },
  env: {
    node: true,
    es6: true
  },
  globals: {
    ASTNode: true,
    FlowTypeDescriptor: true,
    Handler: true,
    NodePath: true,
    PropDescriptor: true,
    PropTypeDescriptor: true,
    Resolver: true
  }
}
