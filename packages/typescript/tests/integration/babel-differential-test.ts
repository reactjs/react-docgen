import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import babelParser, { parse as parseBabel } from '@react-docgen/babel';
import {
  componentHandler,
  createDocgen,
  resolveComponentDefinitions,
} from '@react-docgen/core';
import typescriptPropsHandler from '../../src/handlers/typescriptPropsHandler.js';
import { loadIntegrationCases } from '@react-docgen-internal/integration-tests';
import { parse as parseTypeScript } from '../../src/index.js';

function importer(specifier: string, fromFilename: string) {
  const base = path.resolve(path.dirname(fromFilename), specifier);
  const extensionless = base.replace(/\.[^./]+$/, '');
  const filename = [base, `${extensionless}.js`, `${extensionless}.jsx`].find(
    (candidate) => fs.existsSync(candidate),
  );

  if (!filename) throw new Error(`Cannot resolve ${specifier}.`);

  return { code: fs.readFileSync(filename, 'utf8'), filename };
}

describe('Babel differential', () => {
  for (const integrationCase of loadIntegrationCases({ languages: ['js'] })) {
    if (!integrationCase.output) continue;
    test(integrationCase.id, () => {
      const typescriptOutput = parseTypeScript(integrationCase.source, {
        filename: integrationCase.filename,
        importer,
      });
      const babelOutput = parseBabel(integrationCase.source, {
        filename: integrationCase.filename,
        importer,
      });

      expect(babelOutput).toEqual(typescriptOutput);
      expect(typescriptOutput).toEqual(integrationCase.output);
    });
  }
});

describe('Babel mixin differential', () => {
  const parse = createDocgen({
    handlers: [componentHandler, typescriptPropsHandler],
    parser: babelParser,
    resolver: resolveComponentDefinitions,
  });

  for (const integrationCase of loadIntegrationCases({
    languages: ['typescript'],
  })) {
    if (!integrationCase.id.startsWith('typescript/definitions/mixin-')) {
      continue;
    }

    test(integrationCase.id, () => {
      expect(
        parse(integrationCase.source, { filename: integrationCase.filename }),
      ).toEqual(integrationCase.output);
    });
  }
});
