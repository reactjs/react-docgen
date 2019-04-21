/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import types from 'ast-types';
import isUnreachableFlowType from '../utils/isUnreachableFlowType';
import resolveToValue from '../utils/resolveToValue';
import { unwrapUtilityType } from './flowUtilityTypes';

const { namedTypes: t } = types;

function tryResolveGenericTypeAnnotation(path: NodePath): ?NodePath {
  let typePath = unwrapUtilityType(path);
  let idPath;

  if (typePath.node.id) {
    idPath = typePath.get('id');
  } else if (t.TSTypeReference.check(typePath.node)) {
    idPath = typePath.get('typeName');
  } else if (t.TSExpressionWithTypeArguments.check(typePath.node)) {
    idPath = typePath.get('expression');
  }

  if (idPath) {
    typePath = resolveToValue(idPath);
    if (isUnreachableFlowType(typePath)) {
      return;
    }

    if (t.TypeAlias.check(typePath.node)) {
      return tryResolveGenericTypeAnnotation(typePath.get('right'));
    } else if (t.TSTypeAliasDeclaration.check(typePath.node)) {
      return tryResolveGenericTypeAnnotation(typePath.get('typeAnnotation'));
    }

    return typePath;
  }

  return typePath;
}

/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns undefined.
 */
export default function resolveGenericTypeAnnotation(
  path: NodePath,
): ?NodePath {
  if (!path) return;

  const typePath = tryResolveGenericTypeAnnotation(path);

  if (!typePath || typePath === path) return;

  return typePath;
}
