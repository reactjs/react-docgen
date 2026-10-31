import { describe, expect, test } from 'vitest';
import { loadIntegrationCases } from '@react-docgen-internal/integration-tests';
import { parse, makeFsImporter } from '../../src/main';

describe('integration', () => {
  for (const integrationCase of loadIntegrationCases()) {
    test(integrationCase.id, () => {
      const run = () =>
        parse(integrationCase.source, {
          importer: makeFsImporter(),
          babelOptions: {
            filename: integrationCase.filename,
            babelrc: false,
          },
        });

      if (integrationCase.error) {
        expect(run).toThrow(
          expect.objectContaining({ code: integrationCase.error.code }),
        );
      } else {
        expect(run()).toEqual(integrationCase.output);
      }
    });
  }
});
