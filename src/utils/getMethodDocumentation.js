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

import getFlowType from './getFlowType';
import getMethodJSDoc from './getMethodJSDoc';
import getPropertyName from './getPropertyName';
import getTypeAnnotation from './getTypeAnnotation';

type MethodParameter = {
  name: string;
  description?: ?string;
  type?: ?FlowTypeDescriptor;
};
type MethodReturn = {
  description: ?string;
  type: ?FlowTypeDescriptor;
};

type MethodDocumentation = {
  name: string;
  description: ?string;
  modifiers: Array<string>;
  visibility: string;
  params: Array<MethodParameter>;
  return: ?MethodReturn;
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
      description: null,
      type,
    };

    params.push(param);
  });

  // Add jsdoc @param descriptions.
  if (jsDoc) {
    jsDoc.tags
      .filter(tag => tag.title === 'param')
      .forEach(tag => {
        const param = params.find(p => p.name === tag.name);
        if (param) {
          param.description = tag.description;
        }
      });
  }

  return params;
}

function getMethodReturnDoc(methodPath, jsDoc) {
  const functionExpression = methodPath.get('value');

  let type = null;
  let description = null;

  // Extract flow return type.
  if (functionExpression.node.returnType) {
    const returnType = getTypeAnnotation(functionExpression.get('returnType'));
    if (returnType) {
      type = getFlowType(returnType);
    }
  }

  // Add jsdoc @return description.
  if (jsDoc) {
    const returnTag = jsDoc.tags.find(tag => tag.title === 'returns');
    if (returnTag) {
      description = returnTag.description;
    }
  }

  if (type || description) {
    return {
      type,
      description,
    };
  }
  return null;
}

function getMethodVisibility(jsDoc) {
  if (jsDoc) {
    for (const tag of jsDoc.tags) {
      switch (tag.title) {
        case 'private':
        case 'public':
        case 'protected':
          return tag.title;
        case 'access':
          return tag.access;
        default:
          break;
      }
    }
  }

  return 'public';
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
  const jsDoc = getMethodJSDoc(methodPath);

  return {
    name,
    description: jsDoc && jsDoc.description || null,
    modifiers: getMethodModifiers(methodPath),
    visibility: getMethodVisibility(jsDoc),
    params: getMethodParamsDoc(methodPath, jsDoc),
    return: getMethodReturnDoc(methodPath, jsDoc),
  };
}
