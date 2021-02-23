'use strict';

module.exports = {
  snapshotSerializers: ['./tests/NodePathSerializer.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTestFramework.ts'],
  roots: ['bin', 'src'],
  preset: 'ts-jest',
  testRegex: '/__tests__/.*-test\\.ts$',
};
