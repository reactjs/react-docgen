import { traverseShallow } from '../utils/traverse';
import resolve from 'resolve';
import { dirname } from 'path';
import fs from 'fs';
import type { NodePath } from '@babel/traverse';
import type { ExportSpecifier, Identifier, ObjectProperty } from '@babel/types';
import type { Importer, ImportPath } from '.';
import type FileState from '../FileState';
import { resolveObjectPatternPropertyToValue } from '../utils';

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

      nextState = state.parse(src, resolvedSource);

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
    let resultPath: NodePath | null | undefined;

    traverseShallow(state.path, {
      ExportNamedDeclaration(path) {
        const declaration = path.get('declaration');

        // export const/var ...
        if (declaration.hasNode() && declaration.isVariableDeclaration()) {
          for (const declPath of declaration.get('declarations')) {
            const id = declPath.get('id');
            const init = declPath.get('init');

            if (id.isIdentifier() && id.node.name === name && init.hasNode()) {
              // export const/var a = <init>

              resultPath = init;

              break;
            } else if (id.isObjectPattern()) {
              // export const/var { a } = <init>

              resultPath = id.get('properties').find(prop => {
                if (prop.isObjectProperty()) {
                  const value = prop.get('value');

                  return value.isIdentifier() && value.node.name === name;
                }
                // We don't handle RestElement here yet as complicated

                return false;
              });

              if (resultPath) {
                resultPath = resolveObjectPatternPropertyToValue(
                  resultPath as NodePath<ObjectProperty>,
                );

                break;
              }
            }
            // ArrayPattern not handled yet
          }
        } else if (
          declaration.hasNode() &&
          declaration.has('id') &&
          (declaration.get('id') as NodePath).isIdentifier() &&
          (declaration.get('id') as NodePath<Identifier>).node.name === name
        ) {
          // export function/class/type/interface/enum ...

          resultPath = declaration;
        } else if (path.has('specifiers')) {
          // export { ... } or export x from ... or export * as x from ...

          for (const specifierPath of path.get('specifiers')) {
            if (specifierPath.isExportNamespaceSpecifier()) {
              continue;
            }
            const exported = specifierPath.get('exported');

            if (exported.isIdentifier() && exported.node.name === name) {
              // export ... from ''
              if (path.has('source')) {
                const local = specifierPath.isExportSpecifier()
                  ? specifierPath.node.local.name
                  : 'default';

                resultPath = resolveImportedValue(path, local, state, seen);
                if (resultPath) {
                  break;
                }
              } else {
                resultPath = (specifierPath as NodePath<ExportSpecifier>).get(
                  'local',
                );
                break;
              }
            }
          }
        }

        resultPath ? path.stop() : path.skip();
      },
      ExportDefaultDeclaration(path) {
        if (name === 'default') {
          resultPath = path.get('declaration');

          return path.stop();
        }

        path.skip();
      },
      ExportAllDeclaration(path) {
        const resolvedPath = resolveImportedValue(path, name, state, seen);

        if (resolvedPath) {
          resultPath = resolvedPath;

          return path.stop();
        }

        path.skip();
      },
    });

    return resultPath || null;
  }
}
