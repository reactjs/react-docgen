import { parse } from '@typescript-eslint/typescript-estree';
import { visitorKeys as typescriptVisitorKeys } from '@typescript-eslint/visitor-keys';
import type { Parser, VisitorKeys } from '@react-docgen/core';
import normalize from './normalize.js';

export const visitorKeys: VisitorKeys = typescriptVisitorKeys;

const parser: Parser = {
  parse(source) {
    return normalize(
      parse(source.code, {
        comment: true,
        filePath: source.filename,
        jsx: true,
        loc: true,
        range: true,
      }),
    );
  },
  visitorKeys,
};

export default parser;
