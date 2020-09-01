/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import resolveToValue from './resolveToValue';
import type { Importer } from '../types';

export default function resolveExportDeclaration(
  path: NodePath,
  importer: Importer,
): Array<NodePath> {
  const definitions = [];
  if (path.node.default) {
    definitions.push(path.get('declaration'));
  } else if (path.node.declaration) {
    if (t.VariableDeclaration.check(path.node.declaration)) {
      path
        .get('declaration', 'declarations')
        .each(declarator => definitions.push(declarator));
    } else {
      definitions.push(path.get('declaration'));
    }
  } else if (path.node.specifiers) {
    path
      .get('specifiers')
      .each(specifier =>
        definitions.push(
          specifier.node.id ? specifier.get('id') : specifier.get('local'),
        ),
      );
  }
  return definitions.map(definition => resolveToValue(definition, importer));
}
