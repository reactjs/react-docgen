/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */

import recast from 'recast';

/**
 * Prints the given path without leading or trailing comments.
 */
export default function printValue(path: NodePath): string {
  let p = path;
  while (p.parentPath) {
    p = p.parentPath;
  }
  const fileSource = p.value.root._docgenOriginalFileSource;

  let indent = 0;
  p = path;
  while (p.parentPath) {
    if (!/\S/.test(fileSource.slice(
      p.node.start - p.node.loc.start.column,
      p.node.start
    ))) {
      indent = p.node.loc.start.column;
      break;
    }
    p = p.parentPath;
  }

  let snippet = fileSource.slice(path.node.start, path.node.end);
  if (indent > 0) {
    snippet = snippet.replace(new RegExp("(\\n)\\s{1," + indent + "}", "g"), "$1");
  }
  return snippet;
}
