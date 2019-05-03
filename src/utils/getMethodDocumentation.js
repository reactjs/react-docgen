/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { getDocblock } from './docblock';
import getFlowType from './getFlowType';
import getTSType from './getTSType';
import getParameterName from './getParameterName';
import getPropertyName from './getPropertyName';
import getTypeAnnotation from './getTypeAnnotation';
import recast from 'recast';
import type { FlowTypeDescriptor } from '../types';

const {
  types: { namedTypes: types },
} = recast;

type MethodParameter = {
  name: string,
  type?: ?FlowTypeDescriptor,
  optional?: boolean,
};

type MethodReturn = {
  type: ?FlowTypeDescriptor,
};

type MethodDocumentation = {
  name: string,
  docblock: ?string,
  modifiers: Array<string>,
  params: Array<MethodParameter>,
  returns: ?MethodReturn,
};

function getMethodParamsDoc(methodPath) {
  const params = [];
  const functionExpression = methodPath.get('value');

  // Extract param flow types.
  functionExpression.get('params').each(paramPath => {
    let type = null;
    const typePath = getTypeAnnotation(paramPath);
    if (typePath && types.Flow.check(typePath.node)) {
      type = getFlowType(typePath);
      if (types.GenericTypeAnnotation.check(typePath.node)) {
        type.alias = typePath.node.id.name;
      }
    } else if (typePath) {
      type = getTSType(typePath);
      if (types.TSTypeReference.check(typePath.node)) {
        type.alias = typePath.node.typeName.name;
      }
    }

    const param = {
      name: getParameterName(paramPath),
      optional: paramPath.node.optional,
      type,
    };

    params.push(param);
  });

  return params;
}

// Extract flow return type.
function getMethodReturnDoc(methodPath) {
  const functionExpression = methodPath.get('value');

  if (functionExpression.node.returnType) {
    const returnType = getTypeAnnotation(functionExpression.get('returnType'));
    if (returnType && types.Flow.check(returnType.node)) {
      return { type: getFlowType(returnType) };
    } else if (returnType) {
      return { type: getTSType(returnType) };
    }
  }

  return null;
}

function getMethodModifiers(methodPath) {
  const modifiers = [];

  if (methodPath.node.static) {
    modifiers.push('static');
  }

  if (methodPath.node.kind === 'get' || methodPath.node.kind === 'set') {
    modifiers.push(methodPath.node.kind);
  }

  const functionExpression = methodPath.get('value').node;
  if (functionExpression.generator) {
    modifiers.push('generator');
  }
  if (functionExpression.async) {
    modifiers.push('async');
  }

  return modifiers;
}

export default function getMethodDocumentation(
  methodPath: NodePath,
): ?MethodDocumentation {
  const name = getPropertyName(methodPath);
  if (!name) return null;

  const docblock = getDocblock(methodPath);

  return {
    name,
    docblock,
    modifiers: getMethodModifiers(methodPath),
    params: getMethodParamsDoc(methodPath),
    returns: getMethodReturnDoc(methodPath),
  };
}
