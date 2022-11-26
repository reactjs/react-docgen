import type { NodePath } from '@babel/traverse';
import type {
  ExportAllDeclaration,
  ExportNamedDeclaration,
  ImportDeclaration,
} from '@babel/types';
import type FileState from '../FileState.js';
import ignoreImports from './ignoreImports.js';
import fsImporter, { makeFsImporter } from './fsImporter.js';

export type ImportPath = NodePath<
  ExportAllDeclaration | ExportNamedDeclaration | ImportDeclaration
>;

export type Importer = (
  path: ImportPath,
  name: string,
  file: FileState,
) => NodePath | null;

export { fsImporter, ignoreImports, makeFsImporter };
