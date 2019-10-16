/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import types from 'ast-types';
import type Documentation from '../Documentation';
import { unwrapUtilityType } from '../utils/flowUtilityTypes';
import getFlowType from '../utils/getFlowType';
import getFlowTypeFromReactComponent, {
  applyToFlowTypeProperties,
} from '../utils/getFlowTypeFromReactComponent';
import getPropertyName from '../utils/getPropertyName';
import getTSType from '../utils/getTSType';
import { type TypeParameters } from '../utils/getTypeParameters';
import resolveToValue from '../utils/resolveToValue';
import setPropDescription from '../utils/setPropDescription';

const { namedTypes: t } = types;

function setPropDescriptor(
  documentation: Documentation,
  path: NodePath,
  typeParams: ?TypeParameters,
): void {
  if (t.ObjectTypeSpreadProperty.check(path.node)) {
    const argument = unwrapUtilityType(path.get('argument'));

    if (t.ObjectTypeAnnotation.check(argument.node)) {
      applyToFlowTypeProperties(
        documentation,
        argument,
        (propertyPath, innerTypeParams) => {
          setPropDescriptor(documentation, propertyPath, innerTypeParams);
        },
        typeParams,
      );
      return;
    }

    const name = argument.get('id').get('name');
    const resolvedPath = resolveToValue(name);

    if (resolvedPath && t.TypeAlias.check(resolvedPath.node)) {
      const right = resolvedPath.get('right');
      applyToFlowTypeProperties(
        documentation,
        right,
        (propertyPath, innerTypeParams) => {
          setPropDescriptor(documentation, propertyPath, innerTypeParams);
        },
        typeParams,
      );
    } else {
      documentation.addComposes(name.node.name);
    }
  } else if (t.ObjectTypeProperty.check(path.node)) {
    const type = getFlowType(path.get('value'), typeParams);
    const propName = getPropertyName(path);
    if (!propName) return;

    const propDescriptor = documentation.getPropDescriptor(propName);
    propDescriptor.required = !path.node.optional;
    propDescriptor.flowType = type;

    // We are doing this here instead of in a different handler
    // to not need to duplicate the logic for checking for
    // imported types that are spread in to props.
    setPropDescription(documentation, path);
  } else if (t.TSPropertySignature.check(path.node)) {
    const type = getTSType(path.get('typeAnnotation'), typeParams);

    const propName = getPropertyName(path);
    if (!propName) return;

    const propDescriptor = documentation.getPropDescriptor(propName);
    propDescriptor.required = !path.node.optional;
    propDescriptor.tsType = type;

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

  applyToFlowTypeProperties(
    documentation,
    flowTypesPath,
    (propertyPath, typeParams) => {
      setPropDescriptor(documentation, propertyPath, typeParams);
    },
  );
}
