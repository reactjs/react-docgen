import { expect, test } from 'vitest';
import {
  createDocgen,
  type Handler,
  type Importer,
  type Parser,
  type Resolver,
} from '../index.js';

test('composes neutral parser, resolver, handler, and importer APIs', () => {
  const parser: Parser = {
    visitorKeys: { Program: ['body'] },
    parse: ({ code }) => ({ type: 'Program', body: [], code }),
  };
  const resolver: Resolver = (file) => [file.path];
  const handler: Handler = (documentation, _path, file) => {
    documentation.description = file.import('./description').source.code;
  };
  const importer: Importer = (specifier) => ({
    code: specifier === './description' ? 'Portable description.' : '',
    filename: 'description.js',
  });

  const parse = createDocgen({
    handlers: [handler],
    importer,
    parser,
    resolver,
  });

  expect(parse('')).toEqual([
    { description: 'Portable description.', methods: [] },
  ]);
});
