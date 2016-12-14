/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/**
 * Helper functions to work with docblock comments.
 */

var DOCLET_PATTERN = /^@(\w+)(?:$|\s((?:[^](?!^@\w))*))/gmi;

function parseDocblock(str) {
  var lines = str.split('\n');
  for (var i = 0, l = lines.length; i < l; i++) {
    lines[i] = lines[i].replace(/^\s*\*\s?/, '');
  }
  return lines.join('\n').trim();
}

let DOCBLOCK_HEADER = /^\*\s/;

function filterDocblockComments(comments) {
  return comments.filter(
    comment => (
      comment.type === 'Block' &&
      DOCBLOCK_HEADER.test(comment.value)
    )
  );
}

/**
 * Given a path, this function returns the closest preceding docblock if it
 * exists.
 */
export function getDocblock(path: NodePath): ?string {
  var comments = [];
  if (path.node.comments) {
    comments = filterDocblockComments(path.node.comments)
      .filter(comment => comment.leading);
  }

  if (comments.length > 0) {
    return parseDocblock(comments[comments.length - 1].value);
  }
  return null;
}

export function getTrailingDocblock(path: NodePath): ?string {
  var comments = [];
  if (path.node.comments) {
    comments = filterDocblockComments(path.node.comments)
      .filter(comment => comment.trailing);
  }

  if (comments.length > 0) {
    return parseDocblock(comments[comments.length - 1].value);
  }
  return null;
}

/**
 * Given a string, this functions returns an object with doclet names as keys
 * and their "content" as values.
 */
export function getDoclets(str: string): Object {
  var doclets = Object.create(null);
  var match = DOCLET_PATTERN.exec(str);

  for (; match; match = DOCLET_PATTERN.exec(str)) {
    doclets[match[1]] = match[2] || true;
  }

  return doclets;
}
