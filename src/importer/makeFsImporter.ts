import { traverseShallow } from '../utils/traverse';
import resolve from 'resolve';
import { dirname } from 'path';
import fs from 'fs';
import type { NodePath } from '@babel/traverse';
import type { VariableDeclaration } from '@babel/types';
import type { Importer, ImportPath } from '.';
import type FileState from '../FileState';

function defaultLookupModule(filename: string, basedir: string): string {
  return resolve.sync(filename, {
    basedir,
    extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
  });
}

// Factory for the resolveImports importer
export default function makeFsImporter(
  lookupModule: (
    filename: string,
    basedir: string,
  ) => string = defaultLookupModule,
  cache: Map<string, FileState> = new Map(),
): Importer {
  return resolveImportedValue;

  function resolveImportedValue(
    path: ImportPath,
    name: string,
    state: FileState,
    seen: Set<string> = new Set(),
  ): NodePath | null {
    // Bail if no filename was provided for the current source file.
    // Also never traverse into react itself.
    const source = path.node.source?.value;
    const options = state.opts;
    if (!source || !options || !options.filename || source === 'react') {
      return null;
    }

    // Resolve the imported module using the Node resolver
    const basedir = dirname(options.filename);
    let resolvedSource: string | undefined;

    try {
      resolvedSource = lookupModule(source, basedir);
    } catch (err) {
      return null;
    }

    // Prevent recursive imports
    if (seen.has(resolvedSource)) {
      return null;
    }

    seen.add(resolvedSource);

    let nextState = cache.get(resolvedSource);
    if (!nextState) {
      // Read and parse the code
      const src = fs.readFileSync(resolvedSource, 'utf8');
      nextState = state.parse(src);

      cache.set(resolvedSource, nextState);
    }

    return findExportedValue(nextState, name, seen);
  }

  // Traverses the program looking for an export that matches the requested name
  function findExportedValue(
    state: FileState,
    name: string,
    seen: Set<string>,
  ): NodePath | null {
    let resultPath: NodePath | null = null;

    traverseShallow(state.path, {
      ExportNamedDeclaration(path) {
        const { declaration, specifiers, source } = path.node;
        if (
          declaration &&
          'id' in declaration &&
          declaration.id &&
          'name' in declaration.id &&
          declaration.id.name === name
        ) {
          resultPath = path.get('declaration') as NodePath;
        } else if (
          declaration &&
          'declarations' in declaration &&
          declaration.declarations
        ) {
          (path.get('declaration') as NodePath<VariableDeclaration>)
            .get('declarations')
            .forEach(declPath => {
              const id = declPath.get('id');
              // TODO: ArrayPattern and ObjectPattern
              if (
                id.isIdentifier() &&
                id.node.name === name &&
                'init' in declPath.node &&
                declPath.node.init
              ) {
                resultPath = declPath.get('init') as NodePath;
              }
            });
        } else if (specifiers) {
          path.get('specifiers').forEach(specifierPath => {
            if (
              'name' in specifierPath.node.exported &&
              specifierPath.node.exported.name === name
            ) {
              // TODO TESTME with ExportDefaultSpecifier
              if (source) {
                const local =
                  'local' in specifierPath.node
                    ? specifierPath.node.local.name
                    : 'default';
                resultPath = resolveImportedValue(path, local, state, seen);
              } else if ('local' in specifierPath.node) {
                resultPath = specifierPath.get('local') as NodePath;
              }
            }
          });
        }

        return false;
      },
      ExportDefaultDeclaration(path) {
        if (name === 'default') {
          resultPath = path.get('declaration');
        }

        return false;
      },
      ExportAllDeclaration(path) {
        const resolvedPath = resolveImportedValue(path, name, state, seen);
        if (resolvedPath) {
          resultPath = resolvedPath;
        }

        return false;
      },
    });

    return resultPath;
  }
}
