import fs from 'node:fs';
import path from 'node:path';
import { parse as parseBabel } from '@react-docgen/babel';
import { loadIntegrationCases } from '@react-docgen-internal/integration-tests';
import { describe, expect, test } from 'vitest';
import { parse as parseHermes } from '../../src/index.js';

describe('Babel differential', () => {
  for (const integrationCase of loadIntegrationCases({ languages: ['js'] })) {
    if (integrationCase.error) continue;

    test(integrationCase.id, () => {
      const options = {
        filename: integrationCase.filename,
        importer(specifier: string, fromFilename: string) {
          const filename = path.resolve(path.dirname(fromFilename), specifier);

          return { code: fs.readFileSync(filename, 'utf8'), filename };
        },
      };

      expect(parseHermes(integrationCase.source, options)).toEqual(
        parseBabel(integrationCase.source, options),
      );
    });
  }
});
