import { parse as parseTypeScript } from '@typescript-eslint/typescript-estree';
import { visitorKeys as typescriptVisitorKeys } from '@typescript-eslint/visitor-keys';
import type { Parser, VisitorKeys } from '@react-docgen/core';
import normalize from './normalize.js';

export const visitorKeys: VisitorKeys = typescriptVisitorKeys;
export type ParserOptions = NonNullable<Parameters<typeof parseTypeScript>[1]>;

const parser: Parser = {
  parse(source, options) {
    return normalize(
      parseTypeScript(source.code, {
        comment: true,
        filePath: source.filename,
        jsx: true,
        loc: true,
        range: true,
        ...(options as ParserOptions | undefined),
      }),
    );
  },
  visitorKeys,
};

export default parser;
