import { describe, expect, test } from 'vitest';
import { loadIntegrationCases } from '@react-docgen-internal/integration-tests';
import { parse } from '../../src/index.js';

const supportedCases = [
  'js/definitions/function-declaration',
  'typescript/defaults/function-default-parameters',
];

describe('integration', () => {
  for (const integrationCase of loadIntegrationCases({
    ids: supportedCases,
  })) {
    test(integrationCase.id, () => {
      expect(
        parse(integrationCase.source, {
          filename: integrationCase.filename,
        }),
      ).toEqual(integrationCase.output);
    });
  }
});
