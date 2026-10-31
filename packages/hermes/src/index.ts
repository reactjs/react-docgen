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
  type AstNode,
  type FileState,
  isIdentifier,
} from '@react-docgen/core';
import flowPropsHandler from './handlers/flowPropsHandler.js';
import parser from './parser.js';
import getFlowType from './utils/getFlowType.js';
import { child, typeName } from './utils/ast.js';

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
    propTypesHandler,
    flowPropsHandler,
    defaultPropsHandler,
    contextHandler,
    createMethodHandler((file: FileState, annotation: AstNode) => {
      const type = getFlowType(file, annotation);
      const unwrapped =
        annotation.type === 'TypeAnnotation'
          ? child(annotation, 'typeAnnotation')
          : annotation;
      const id =
        unwrapped?.type === 'GenericTypeAnnotation'
          ? child(unwrapped, 'id')
          : null;

      return type?.name === 'signature' && id && isIdentifier(id)
        ? { ...type, alias: typeName(id) }
        : type;
    }),
  ],
  parser,
  resolver: resolveComponentDefinitions,
});

export function parse(
  code: string,
  { filename = 'component.js', importer }: ParseOptions = {},
): ComponentDocumentation[] {
  return docgen(code, { filename, importer });
}
