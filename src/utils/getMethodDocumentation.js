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

import {getDocblock} from './docblock';
import getFlowType from './getFlowType';
import getPropertyName from './getPropertyName';
import getTypeAnnotation from './getTypeAnnotation';

type MethodParameter = {
  name: string;
  type?: ?FlowTypeDescriptor;
};

type MethodReturn = {
  type: ?FlowTypeDescriptor;
};

type MethodDocumentation = {
  name: string;
  docblock: ?string;
  modifiers: Array<string>;
  params: Array<MethodParameter>;
  returns: ?MethodReturn;
};

function getMethodParamsDoc(methodPath, jsDoc) {
  const params = [];
  const functionExpression = methodPath.get('value');

  // Extract param flow types.
  functionExpression.get('params').each(paramPath => {
    let type = null;
    const typePath = getTypeAnnotation(paramPath);
    if (typePath) {
      type = getFlowType(typePath);
    }

    const param = {
      name: paramPath.node.name,
      type,
    };

    params.push(param);
  });

  return params;
}

// Extract flow return type.
function getMethodReturnDoc(methodPath, jsDoc) {
  const functionExpression = methodPath.get('value');

  if (functionExpression.node.returnType) {
    const returnType = getTypeAnnotation(functionExpression.get('returnType'));
    if (returnType) {
      return {type: getFlowType(returnType)};
    }
  }

  return null;
}

function getMethodModifiers(methodPath) {
  const modifiers = [];

  if (methodPath.node.static) {
    modifiers.push('static');
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

export default function getMethodDocumentation(methodPath: NodePath): MethodDocumentation {
  const name = getPropertyName(methodPath);
  const docblock = getDocblock(methodPath);

  return {
    name,
    docblock,
    modifiers: getMethodModifiers(methodPath),
    params: getMethodParamsDoc(methodPath),
    returns: getMethodReturnDoc(methodPath),
  };
}
