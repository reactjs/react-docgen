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
const {
  types: { namedTypes: types },
} = recast;

function hasTypeAnnotation(path: NodePath): boolean {
  return !!path.node.typeAnnotation;
}

/**
 * Gets the most inner valuable TypeAnnotation from path. If no TypeAnnotation
 * can be found nothing is returned
 */
export default function getTypeAnnotation(path: NodePath): ?NodePath {
  if (!hasTypeAnnotation(path)) return null;

  let resultPath: NodePath = path;
  do {
    resultPath = resultPath.get('typeAnnotation');
  } while (
    hasTypeAnnotation(resultPath) &&
    !types.FlowType.check(resultPath.node)
  );

  return resultPath;
}
