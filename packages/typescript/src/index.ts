import {
  componentHandler,
  contextHandler,
  createDocgen,
  createMethodHandler,
  defaultPropsHandler,
  propTypesHandler,
  resolveComponentDefinitions,
  type ComponentDocumentation,
  type Importer,
} from '@react-docgen/core';
import typescriptPropsHandler from './handlers/typescriptPropsHandler.js';
import parser from './parser.js';
import getTSType from './utils/getTSType.js';

export {
  default as parser,
  visitorKeys,
  type ParserOptions,
} from './parser.js';

export interface ParseOptions {
  filename?: string;
  importer?: Importer;
}

const docgen = createDocgen({
  handlers: [
    componentHandler,
    typescriptPropsHandler,
    propTypesHandler,
    defaultPropsHandler,
    contextHandler,
    createMethodHandler(getTSType),
  ],
  parser,
  resolver: resolveComponentDefinitions,
});

export function parse(
  code: string,
  { filename = 'component.tsx', importer }: ParseOptions = {},
): ComponentDocumentation[] {
  return docgen(code, { filename, importer });
}
