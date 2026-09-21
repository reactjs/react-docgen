import { FlowVisitorKeys, parse, type ParserOptions } from 'hermes-parser';
import type { Parser, VisitorKeys } from '@react-docgen/core';
import normalize from './normalize.js';

export const visitorKeys: VisitorKeys = FlowVisitorKeys;
export type { ParserOptions };

const parser: Parser = {
  parse(source, options) {
    if (/\.(?:cts|mts|ts|tsx)$/.test(source.filename)) {
      throw Object.assign(
        new Error('The Hermes adapter does not support TypeScript syntax.'),
        { code: 'ERR_REACTDOCGEN_PARSER_CAPABILITY' },
      );
    }

    return normalize(
      parse(source.code, {
        flow: 'all',
        sourceType: 'unambiguous',
        ...(options as Partial<ParserOptions> | undefined),
      }),
    );
  },
  visitorKeys,
};

export default parser;
