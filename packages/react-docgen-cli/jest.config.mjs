export default {
  displayName: {
    name: 'react-docgen-cli',
    color: 'yellow',
  },
  collectCoverageFrom: ['src/**/*.ts', '!**/__tests__/**', '!**/__mocks__/**'],
  coverageReporters: ['cobertura', 'text'],
  preset: 'ts-jest',
  testRegex: '/__tests__/.*-test\\.ts$',
};
