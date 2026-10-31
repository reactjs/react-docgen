import { parseSync, type TransformOptions } from '@babel/core';
import { VISITOR_KEYS } from '@babel/types';
import {
  createDocgen,
  reactHandlers,
  resolveComponentDefinitions,
  type ComponentDocumentation,
  type DocgenParseOptions,
  type Parser,
  type VisitorKeys,
} from '@react-docgen/core';
import normalize from './normalize.js';

export const visitorKeys: VisitorKeys = {
  ...VISITOR_KEYS,
  Literal: [],
  MethodDefinition: ['key', 'value', 'decorators'],
  Property: ['key', 'value', 'decorators'],
  PropertyDefinition: ['key', 'value', 'decorators'],
};

const parser: Parser = {
  parse(source, options) {
    const ast = parseSync(source.code, {
      ast: true,
      code: false,
      filename: source.filename,
      parserOpts: {
        plugins: ['jsx', 'typescript', 'estree'],
      },
      ...(options as TransformOptions | undefined),
    });

    if (!ast) throw new TypeError('Babel did not return an AST.');

    return normalize(ast);
  },
  visitorKeys,
};

export default parser;
export { parser };

const docgen = createDocgen({
  handlers: reactHandlers,
  parser,
  resolver: resolveComponentDefinitions,
});

export function parse(
  code: string,
  options?: DocgenParseOptions,
): ComponentDocumentation[] {
  return docgen(code, options);
}
