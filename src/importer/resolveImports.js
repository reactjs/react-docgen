/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t, NodePath } from 'ast-types';
import { traverseShallow } from '../utils/traverse';
import resolve from 'resolve';
import { dirname } from 'path';
import buildParser, { type Options } from '../babelParser';
import fs from 'fs';

export default function resolveImportedValue(
  path: NodePath,
  name: string,
  seen: Set<string> = new Set(),
) {
  // Bail if no filename was provided for the current source file.
  // Also never traverse into react itself.
  const source = path.node.source.value;
  const options = getOptions(path);
  if (!options || !options.filename || source === 'react') {
    return null;
  }

  // Resolve the imported module using the Node resolver
  const basedir = dirname(options.filename);
  let resolvedSource;

  try {
    resolvedSource = resolve.sync(source, {
      basedir,
      extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
    });
  } catch (err) {
    return null;
  }

  // Prevent recursive imports
  if (seen.has(resolvedSource)) {
    return null;
  }

  seen.add(resolvedSource);

  // Read and parse the code
  // TODO: cache and reuse
  const src = fs.readFileSync(resolvedSource, 'utf8');
  const parseOptions: Options = {
    ...options,
    parserOptions: {},
    filename: resolvedSource,
  };

  const parser = buildParser(parseOptions);
  const ast = parser.parse(src);
  ast.__src = src;
  return findExportedValue(new NodePath(ast).get('program'), name, seen);
}

// Find the root Program node, which we attached our options too in babelParser.js
function getOptions(path: NodePath): Options {
  while (!t.Program.check(path.node)) {
    path = path.parentPath;
  }

  return path.node.options || {};
}

// Traverses the program looking for an export that matches the requested name
function findExportedValue(programPath, name, seen) {
  let resultPath: ?NodePath = null;

  traverseShallow(programPath, {
    visitExportNamedDeclaration(path: NodePath) {
      const { declaration, specifiers, source } = path.node;
      if (declaration && declaration.id && declaration.id.name === name) {
        resultPath = path.get('declaration');
      } else if (declaration && declaration.declarations) {
        path.get('declaration', 'declarations').each((declPath: NodePath) => {
          const decl = declPath.node;
          // TODO: ArrayPattern and ObjectPattern
          if (
            t.Identifier.check(decl.id) &&
            decl.id.name === name &&
            decl.init
          ) {
            resultPath = declPath.get('init');
          }
        });
      } else if (specifiers) {
        path.get('specifiers').each((specifierPath: NodePath) => {
          if (specifierPath.node.exported.name === name) {
            if (source) {
              const local = specifierPath.node.local.name;
              resultPath = resolveImportedValue(path, local, seen);
            } else {
              resultPath = specifierPath.get('local');
            }
          }
        });
      }

      return false;
    },
    visitExportDefaultDeclaration(path: NodePath) {
      if (name === 'default') {
        resultPath = path.get('declaration');
      }

      return false;
    },
    visitExportAllDeclaration(path: NodePath) {
      const resolvedPath = resolveImportedValue(path, name, seen);
      if (resolvedPath) {
        resultPath = resolvedPath;
      }

      return false;
    },
  });

  return resultPath;
}
