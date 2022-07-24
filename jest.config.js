'use strict';

module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!**/__tests__/**', '!**/__mocks__/**'],
  coverageReporters: ['cobertura', 'text'],
  displayName: 'Unit',
  snapshotSerializers: ['./tests/NodePathSerializer.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTestFramework.ts'],
  roots: ['bin', 'src'],
  preset: 'ts-jest',
  testRegex: '/__tests__/.*-test\\.ts$',
};
