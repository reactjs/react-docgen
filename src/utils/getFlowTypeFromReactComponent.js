/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Documentation from '../Documentation';
import getTypeAnnotation from '../utils/getTypeAnnotation';
import getMemberValuePath from '../utils/getMemberValuePath';
import isReactComponentClass from '../utils/isReactComponentClass';
import isStatelessComponent from '../utils/isStatelessComponent';
import resolveGenericTypeAnnotation from '../utils/resolveGenericTypeAnnotation';

/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns null.
 */
export default (path: NodePath): ?NodePath => {
  let typePath: ?NodePath;

  if (isReactComponentClass(path)) {
    const superTypes = path.get('superTypeParameters');

    if (superTypes.value) {
      const params = superTypes.get('params');
      if (params.value.length === 3) {
        typePath = params.get(1);
      } else {
        typePath = params.get(0);
      }
    } else {
      const propsMemberPath = getMemberValuePath(path, 'props');
      if (!propsMemberPath) {
        return null;
      }

      typePath = getTypeAnnotation(propsMemberPath.parentPath);
    }
  } else if (isStatelessComponent(path)) {
    const param = path.get('params').get(0);

    typePath = getTypeAnnotation(param);
  }

  return typePath;
};

export function applyToFlowTypeProperties(
  documentation: Documentation,
  path: NodePath,
  callback: (propertyPath: NodePath) => void,
) {
  if (path.node.properties) {
    path.get('properties').each(propertyPath => callback(propertyPath));
  } else if (path.node.members) {
    path.get('members').each(propertyPath => callback(propertyPath));
  } else if (path.node.type === 'InterfaceDeclaration') {
    if (path.node.extends) {
      applyExtends(documentation, path, callback);
    }

    path.get('body', 'properties').each(propertyPath => callback(propertyPath));
  } else if (path.node.type === 'TSInterfaceDeclaration') {
    if (path.node.extends) {
      applyExtends(documentation, path, callback);
    }

    path.get('body', 'body').each(propertyPath => callback(propertyPath));
  } else if (
    path.node.type === 'IntersectionTypeAnnotation' ||
    path.node.type === 'TSIntersectionType'
  ) {
    path
      .get('types')
      .each(typesPath => applyToFlowTypeProperties(documentation, typesPath, callback));
  } else if (path.node.type !== 'UnionTypeAnnotation') {
    // The react-docgen output format does not currently allow
    // for the expression of union types
    const typePath = resolveGenericTypeAnnotation(path);
    if (typePath) {
      applyToFlowTypeProperties(documentation, typePath, callback);
    }
  }
}

function applyExtends(documentation, path, callback) {
  path.get('extends').each((extendsPath: NodePath) => {
    const resolvedPath = resolveGenericTypeAnnotation(extendsPath);
    if (resolvedPath) {
      applyToFlowTypeProperties(documentation, resolvedPath, callback);
    } else {
      let id = extendsPath.node.id || extendsPath.node.typeName || extendsPath.node.expression;
      if (id && id.type === 'Identifier') {
        documentation.addComposes(id.name);
      }
    }
  });
}
