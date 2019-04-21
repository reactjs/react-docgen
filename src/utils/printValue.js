/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import strip from 'strip-indent';

function deindent(code: string): string {
  const firstNewLine = code.indexOf('\n');

  return (
    code.slice(0, firstNewLine + 1) +
    // remove indentation from all lines except first.
    strip(code.slice(firstNewLine + 1))
  );
}

function getSrcFromAst(path: NodePath): string {
  do {
    if (path.node.type === 'File') {
      return path.node.__src;
    }
    path = path.parentPath;
  } while (path != null);

  throw new Error('Could not find source attached to File node');
}

/**
 * Prints the given path without leading or trailing comments.
 */
export default function printValue(path: NodePath): string {
  const src = getSrcFromAst(path);

  // TODO: Filter out comments in returned code

  return deindent(src.slice(path.node.start, path.node.end));
}
