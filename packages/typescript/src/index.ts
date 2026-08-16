import {
  extract,
  ProjectContext,
  type ComponentDocumentation,
} from '@react-docgen/core';
import { handler, resolver } from './extractFunctionComponent.js';
import parser from './parser.js';

export { default as parser, visitorKeys } from './parser.js';

export interface ParseOptions {
  filename?: string;
}

export function parse(
  code: string,
  { filename = 'component.tsx' }: ParseOptions = {},
): ComponentDocumentation[] {
  const project = new ProjectContext({
    importer() {
      throw new Error('Imports are not supported by this vertical slice.');
    },
    selectParser: () => parser,
  });
  const file = project.parse({ code, filename });

  return extract(file, resolver, [handler]);
}
