/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import getMemberValuePath from '../utils/getMemberValuePath';
import resolveToValue from '../utils/resolveToValue';
import setPropDescription from '../utils/setPropDescription';
import type Documentation from '../Documentation';
import type { Importer } from '../types';

function resolveDocumentation(
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
): void {
  if (!t.ObjectExpression.check(path.node)) {
    return;
  }

  path.get('properties').each(propertyPath => {
    if (t.Property.check(propertyPath.node)) {
      setPropDescription(documentation, propertyPath, importer);
    } else if (t.SpreadElement.check(propertyPath.node)) {
      const resolvedValuePath = resolveToValue(
        propertyPath.get('argument'),
        importer,
      );
      resolveDocumentation(documentation, resolvedValuePath, importer);
    }
  });
}

export default function propDocBlockHandler(
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
) {
  let propTypesPath = getMemberValuePath(path, 'propTypes', importer);
  if (!propTypesPath) {
    return;
  }
  propTypesPath = resolveToValue(propTypesPath, importer);
  if (!propTypesPath) {
    return;
  }

  resolveDocumentation(documentation, propTypesPath, importer);
}
