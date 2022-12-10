import type { ObjectExpression } from '@babel/types';
import fs from 'fs';
import { temporaryDirectory } from 'tempy';
import { parse as testParse, noopImporter } from '../../tests/utils';
import parse from '../parse.js';
import { describe, expect, test, vi } from 'vitest';
import { ERROR_CODES } from '../error';

describe('parse', () => {
  test('allows custom component definition resolvers', () => {
    const path = testParse.expression<ObjectExpression>('{foo: "bar"}');
    const resolver = vi.fn(() => [path]);
    const handler = vi.fn();

    parse('//empty', {
      resolver,
      handlers: [handler],
      importer: noopImporter,
      babelOptions: {},
    });

    expect(resolver).toBeCalled();
    expect(handler.mock.calls[0][1]).toBe(path);
  });

  test('errors if component definition is not found', () => {
    const resolver = vi.fn(() => []);

    expect(() =>
      parse('//empty', {
        resolver,
        handlers: [],
        importer: noopImporter,
        babelOptions: {},
      }),
    ).toThrowError(
      expect.objectContaining({
        code: ERROR_CODES.MISSING_DEFINITION,
      }),
    );
    expect(resolver).toBeCalled();

    expect(() =>
      parse('//empty', {
        resolver,
        handlers: [],
        importer: noopImporter,
        babelOptions: {},
      }),
    ).toThrowError(
      expect.objectContaining({
        code: ERROR_CODES.MISSING_DEFINITION,
      }),
    );
    expect(resolver).toBeCalled();
  });

  test('uses local babelrc', () => {
    const dir = temporaryDirectory();

    try {
      // Write and empty babelrc to override the parser defaults
      fs.writeFileSync(`${dir}/.babelrc`, '{}');

      expect(() =>
        parse('const chained  = () => a |> b', {
          resolver: () => [],
          handlers: [],
          importer: noopImporter,
          babelOptions: { cwd: dir, filename: `${dir}/component.js` },
        }),
      ).toThrowError(
        /.*Support for the experimental syntax 'pipelineOperator' isn't currently enabled.*/,
      );
    } finally {
      fs.unlinkSync(`${dir}/.babelrc`);
      fs.rmdirSync(dir);
    }
  });

  test('supports custom parserOptions with plugins', () => {
    expect(() =>
      parse('const chained: Type = 1;', {
        resolver: () => [],
        handlers: [],
        importer: noopImporter,
        babelOptions: {
          parserOpts: {
            plugins: [
              // no flow
              'jsx',
            ],
          },
        },
      }),
    ).toThrowError(/.*\(1:13\).*/);
  });

  test('supports custom parserOptions without plugins', () => {
    expect(() =>
      parse('const chained: Type = 1;', {
        resolver: () => [],
        handlers: [],
        importer: noopImporter,
        babelOptions: {
          parserOpts: {
            allowSuperOutsideMethod: true,
          },
        },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: ERROR_CODES.MISSING_DEFINITION,
      }),
    );
  });
});
