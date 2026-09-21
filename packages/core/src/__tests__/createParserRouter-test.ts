import { describe, expect, test, vi } from 'vitest';
import {
  createDocgen,
  createParserRouter,
  type Handler,
  type Parser,
  type Resolver,
} from '../index.js';

const resolver: Resolver = (file) => [file.path];
const handler: Handler = (documentation, _path, file) => {
  documentation.description = file.ast.type;
};

function makeParser(type: string): Parser {
  return {
    parse: vi.fn((_source, options) => ({ type, options })),
    visitorKeys: {},
  };
}

describe('createParserRouter', () => {
  test('uses the first matching filename, glob, or custom rule', () => {
    const exact = makeParser('Exact');
    const glob = makeParser('Glob');
    const custom = makeParser('Custom');
    const router = createParserRouter([
      { test: '/project/special.tsx', parser: exact },
      { test: '**/*.tsx', parser: glob, options: { jsx: true } },
      { test: (filename) => filename.endsWith('.js'), parser: custom },
    ]);

    expect(router('/project/special.tsx')).toEqual({
      options: undefined,
      parser: exact,
    });
    expect(router('/project/Button.tsx')).toEqual({
      options: { jsx: true },
      parser: glob,
    });
    expect(router('/project/Button.js')).toEqual({
      options: undefined,
      parser: custom,
    });
  });

  test('supports standard glob syntax', () => {
    const parser = makeParser('Matched');
    const router = createParserRouter([{ test: '**/*.{js,tsx}', parser }]);

    expect(router('/project/Button.tsx').parser).toBe(parser);
    expect(router('/project/Button.js').parser).toBe(parser);
    expect(() => router('/project/Button.css')).toThrow();
  });

  test('passes route options and requires a filename for multiple parsers', () => {
    const typescript = makeParser('TypeScriptFile');
    const hermes = makeParser('HermesFile');
    const parse = createDocgen({
      handlers: [handler],
      parser: createParserRouter([
        { test: /\.tsx$/, parser: typescript, options: { jsx: true } },
        { test: /\.js$/, parser: hermes },
      ]),
      resolver,
    });

    expect(() => parse('')).toThrow(
      'A filename is required when multiple parsers are configured.',
    );
    expect(parse('', { filename: 'Button.tsx' })).toEqual([
      { description: 'TypeScriptFile', methods: [] },
    ]);
    expect(typescript.parse).toHaveBeenCalledWith(
      { code: '', filename: 'Button.tsx' },
      { jsx: true },
    );
  });

  test('routes imported files independently', () => {
    const parse = createDocgen({
      handlers: [
        (_documentation, _path, file) => {
          _documentation.description = file.import('./support.js').ast.type;
        },
      ],
      importer: () => ({ code: '', filename: '/project/support.js' }),
      parser: createParserRouter([
        { test: '**/*.tsx', parser: makeParser('TypeScriptFile') },
        { test: '**/*.js', parser: makeParser('HermesFile') },
      ]),
      resolver,
    });

    expect(parse('', { filename: '/project/Button.tsx' })).toEqual([
      { description: 'HermesFile', methods: [] },
    ]);
  });

  test('reports an explicit no-match error', () => {
    const router = createParserRouter([
      { test: '**/*.tsx', parser: makeParser('TypeScriptFile') },
    ]);

    expect(() => router('/project/Button.js')).toThrow(
      'No parser route matched "/project/Button.js".',
    );
  });
});
