import { FlowVisitorKeys, parse } from 'hermes-parser';
import type { Parser, VisitorKeys } from '@react-docgen/core';
import normalize from './normalize.js';

export const visitorKeys: VisitorKeys = FlowVisitorKeys;

const parser: Parser = {
  parse(source) {
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
      }),
    );
  },
  visitorKeys,
};

export default parser;
