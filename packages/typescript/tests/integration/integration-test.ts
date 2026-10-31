import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadIntegrationCases } from '@react-docgen-internal/integration-tests';
import { parse } from '../../src/index.js';

describe('integration', () => {
  for (const integrationCase of loadIntegrationCases({
    languages: ['js', 'typescript'],
  })) {
    // Its support file uses Babel-only `export defaultFrom` syntax (PLAN.md).
    const babelOnly =
      integrationCase.id === 'typescript/imports/reexported-default-values';

    test.skipIf(babelOnly)(integrationCase.id, () => {
      const run = () =>
        parse(integrationCase.source, {
          filename: integrationCase.filename,
          importer(specifier, fromFilename) {
            const base = path.resolve(path.dirname(fromFilename), specifier);
            const extensionless = base.replace(/\.[^./]+$/, '');
            const filename = [
              base,
              `${extensionless}.js`,
              `${extensionless}.jsx`,
              `${extensionless}.ts`,
              `${extensionless}.tsx`,
            ].find((candidate) => fs.existsSync(candidate));

            if (!filename) throw new Error(`Cannot resolve ${specifier}.`);

            return { code: fs.readFileSync(filename, 'utf8'), filename };
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
