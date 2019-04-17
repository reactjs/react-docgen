/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import recast from 'recast';

import type Documentation from '../Documentation';

import getFlowType from '../utils/getFlowType';
import getPropertyName from '../utils/getPropertyName';
import getFlowTypeFromReactComponent, {
  applyToFlowTypeProperties,
} from '../utils/getFlowTypeFromReactComponent';
import resolveToValue from '../utils/resolveToValue';
import setPropDescription from '../utils/setPropDescription';
import { unwrapUtilityType } from '../utils/flowUtilityTypes';

const {
  types: { namedTypes: types },
} = recast;
function setPropDescriptor(documentation: Documentation, path: NodePath): void {
  if (types.ObjectTypeSpreadProperty.check(path.node)) {
    const argument = unwrapUtilityType(path.get('argument'));

    if (types.ObjectTypeAnnotation.check(argument.node)) {
      applyToFlowTypeProperties(argument, propertyPath => {
        setPropDescriptor(documentation, propertyPath);
      });
      return;
    }

    const name = argument.get('id').get('name');
    const resolvedPath = resolveToValue(name);

    if (resolvedPath && types.TypeAlias.check(resolvedPath.node)) {
      const right = resolvedPath.get('right');
      applyToFlowTypeProperties(right, propertyPath => {
        setPropDescriptor(documentation, propertyPath);
      });
    } else {
      documentation.addComposes(name.node.name);
    }
  } else if (types.ObjectTypeProperty.check(path.node)) {
    const type = getFlowType(path.get('value'));
    const propName = getPropertyName(path);
    if (!propName) return;

    const propDescriptor = documentation.getPropDescriptor(propName);
    propDescriptor.required = !path.node.optional;
    propDescriptor.flowType = type;

    // We are doing this here instead of in a different handler
    // to not need to duplicate the logic for checking for
    // imported types that are spread in to props.
    setPropDescription(documentation, path);
  }
}

/**
 * This handler tries to find flow Type annotated react components and extract
 * its types to the documentation. It also extracts docblock comments which are
 * inlined in the type definition.
 */
export default function flowTypeHandler(
  documentation: Documentation,
  path: NodePath,
) {
  const flowTypesPath = getFlowTypeFromReactComponent(path);

  if (!flowTypesPath) {
    return;
  }

  applyToFlowTypeProperties(flowTypesPath, propertyPath => {
    setPropDescriptor(documentation, propertyPath);
  });
}
