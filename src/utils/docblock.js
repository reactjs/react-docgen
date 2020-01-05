/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Helper functions to work with docblock comments.
 */

const DOCLET_PATTERN = /^@(\w+)(?:$|\s((?:[^](?!^@\w))*))/gim;

function parseDocblock(str) {
  // Does not use \s in the regex as this would match also \n and conflicts
  // with windows line endings.
  return str.replace(/^[ \t]*\*[ \t]?/gm, '').trim();
}

const DOCBLOCK_HEADER = /^\*\s/;

/**
 * Given a path, this function returns the closest preceding docblock if it
 * exists.
 */
export function getDocblock(
  path: NodePath,
  trailing: boolean = false,
): ?string {
  let comments = [];
  if (trailing && path.node.trailingComments) {
    comments = path.node.trailingComments.filter(
      comment =>
        comment.type === 'CommentBlock' && DOCBLOCK_HEADER.test(comment.value),
    );
  } else if (path.node.leadingComments) {
    comments = path.node.leadingComments.filter(
      comment =>
        comment.type === 'CommentBlock' && DOCBLOCK_HEADER.test(comment.value),
    );
  } else if (path.node.comments) {
    comments = path.node.comments.filter(
      comment =>
        comment.leading &&
        comment.type === 'CommentBlock' &&
        DOCBLOCK_HEADER.test(comment.value),
    );
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
  const doclets = Object.create(null);
  let match = DOCLET_PATTERN.exec(str);

  for (; match; match = DOCLET_PATTERN.exec(str)) {
    doclets[match[1]] = match[2] || true;
  }

  return doclets;
}
