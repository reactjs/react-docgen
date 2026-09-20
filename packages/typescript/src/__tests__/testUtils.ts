import {
  ProjectContext,
  type FileState,
  type Importer,
} from '@react-docgen/core';
import parser from '../parser.js';

export default function parseFile(
  code: string,
  filename = 'component.tsx',
  importer?: Importer,
): FileState {
  const project = new ProjectContext({
    importer:
      importer ??
      (() => {
        throw new Error('Unexpected import.');
      }),
    selectParser: () => parser,
  });

  return project.parse({ code, filename });
}
