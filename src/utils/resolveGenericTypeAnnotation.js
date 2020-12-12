/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import isUnreachableFlowType from '../utils/isUnreachableFlowType';
import resolveToValue from '../utils/resolveToValue';
import { unwrapUtilityType } from './flowUtilityTypes';
import type { Importer } from '../types';

function tryResolveGenericTypeAnnotation(
  path: NodePath,
  importer: Importer,
): ?NodePath {
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
    typePath = resolveToValue(idPath, importer);
    if (isUnreachableFlowType(typePath)) {
      return;
    }

    if (t.TypeAlias.check(typePath.node)) {
      return tryResolveGenericTypeAnnotation(typePath.get('right'), importer);
    } else if (t.TSTypeAliasDeclaration.check(typePath.node)) {
      return tryResolveGenericTypeAnnotation(
        typePath.get('typeAnnotation'),
        importer,
      );
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
  importer: Importer,
): ?NodePath {
  if (!path) return;

  const typePath = tryResolveGenericTypeAnnotation(path, importer);

  if (!typePath || typePath === path) return;

  return typePath;
}
