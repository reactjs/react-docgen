export default {
  displayName: {
    name: 'react-docgen',
    color: 'blue',
  },
  collectCoverageFrom: ['src/**/*.ts', '!**/__tests__/**', '!**/__mocks__/**'],
  coverageReporters: ['cobertura', 'text'],
  snapshotSerializers: ['./tests/NodePathSerializer.js'],
  setupFilesAfterEnv: ['./tests/setupTestFramework.ts'],
  preset: 'ts-jest',
  testRegex: '(/__tests__/|/tests/integration/).*-test\\.ts$',
};
