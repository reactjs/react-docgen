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

import recast from 'recast';

import getMemberValuePath from '../utils/getMemberValuePath';
import getMethodDocumentation from '../utils/getMethodDocumentation';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactComponentMethod from '../utils/isReactComponentMethod';
import isReactCreateClassCall from '../utils/isReactCreateClassCall';

import type Documentation from '../Documentation';

const {types: {namedTypes: types}} = recast;

function getMethodsDoc(methodPaths) {
  const methods = [];

  methodPaths.forEach((methodPath) => {
    if (isReactComponentMethod(methodPath)) {
      return;
    }

    methods.push(getMethodDocumentation(methodPath));
  });

  return methods;
}

/**
 * Extract all flow types for the methods of a react component. Doesn't
 * return any react specific lifecycle methods.
 */
export default function componentMethodsHandler(
  documentation: Documentation,
  path: NodePath
) {
  // Extract all methods from the class or object.
  let methodPaths;
  if (isReactComponentClass(path)) {
    methodPaths = path
      .get('body', 'body')
      .filter(p => types.MethodDefinition.check(p.node) && p.node.kind !== 'constructor');
  } else if (types.ObjectExpression.check(path.node)) {
    const properties = path.get('properties');

    // Add the statics object properties.
    const statics = getMemberValuePath(path, 'statics');
    if (statics) {
      statics.get('properties').each(p => {
        p.node.static = true;
        properties.push(p.node);
      });
    }

    methodPaths = properties.filter(p => types.FunctionExpression.check(p.get('value').node));
  }

  if (!methodPaths) {
    documentation.set('methods', []);
    return;
  }

  const methods = getMethodsDoc(methodPaths);
  documentation.set('methods', methods);
}
