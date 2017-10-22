/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */

/* eslint no-use-before-define: 0 */

import getPropertyName from './getPropertyName';
import printValue from './printValue';
import recast from 'recast';
import getTypeAnnotation from '../utils/getTypeAnnotation';
import resolveToValue from '../utils/resolveToValue';

const { types: { namedTypes: types } } = recast;

const flowTypes = {
  AnyTypeAnnotation: 'any',
  BooleanTypeAnnotation: 'boolean',
  MixedTypeAnnotation: 'mixed',
  NumberTypeAnnotation: 'number',
  StringTypeAnnotation: 'string',
  VoidTypeAnnotation: 'void',
};

const flowLiteralTypes = {
  BooleanLiteralTypeAnnotation: 1,
  NumberLiteralTypeAnnotation: 1,
  StringLiteralTypeAnnotation: 1,
};

const namedTypes = {
  GenericTypeAnnotation: handleGenericTypeAnnotation,
  ObjectTypeAnnotation: handleObjectTypeAnnotation,
  UnionTypeAnnotation: handleUnionTypeAnnotation,
  NullableTypeAnnotation: handleNullableTypeAnnotation,
  FunctionTypeAnnotation: handleFunctionTypeAnnotation,
  IntersectionTypeAnnotation: handleIntersectionTypeAnnotation,
  TupleTypeAnnotation: handleTupleTypeAnnotation,
  TypeofTypeAnnotation: handleTypeofTypeAnnotation,
};

function getFlowTypeWithRequirements(path: NodePath): FlowTypeDescriptor {
  const type = getFlowType(path);

  type.required = !path.parentPath.node.optional;

  return type;
}

function handleGenericTypeAnnotation(path: NodePath) {
  let type;
  if (types.QualifiedTypeIdentifier.check(path.node.id)) {
    type = handleQualifiedTypeIdentifier(path.get('id'));
  } else {
    type = { name: path.node.id.name };
  }

  if (path.node.typeParameters) {
    const params = path.get('typeParameters').get('params');

    type = {
      ...type,
      elements: params.map(param => getFlowType(param)),
      raw: printValue(path),
    };
  } else {
    let resolvedPath = resolveToValue(path.get('id'));
    if (resolvedPath && resolvedPath.node.right) {
      type = getFlowType(resolvedPath.get('right'));
    }
  }

  return type;
}

function handleObjectTypeAnnotation(path: NodePath) {
  const type = {
    name: 'signature',
    type: 'object',
    raw: printValue(path),
    signature: { properties: [] },
  };

  path.get('callProperties').each(param => {
    type.signature.constructor = getFlowType(param.get('value'));
  });

  path.get('indexers').each(param => {
    type.signature.properties.push({
      key: getFlowType(param.get('key')),
      value: getFlowTypeWithRequirements(param.get('value')),
    });
  });

  path.get('properties').each(param => {
    type.signature.properties.push({
        key: getPropertyName(param),
        value: getFlowTypeWithRequirements(param.get('value')),
    });
  });

  return type;
}

function handleUnionTypeAnnotation(path: NodePath) {
  return {
    name: 'union',
    raw: printValue(path),
    elements: path.get('types').map(subType => getFlowType(subType)),
  };
}

function handleIntersectionTypeAnnotation(path: NodePath) {
  return {
    name: 'intersection',
    raw: printValue(path),
    elements: path.get('types').map(subType => getFlowType(subType)),
  };
}

function handleNullableTypeAnnotation(path: NodePath) {
  const typeAnnotation = getTypeAnnotation(path);

  if (!typeAnnotation) return null;

  const type = getFlowType(typeAnnotation);
  type.nullable = true;

  return type;
}

function handleFunctionTypeAnnotation(path: NodePath) {
  const type = {
    name: 'signature',
    type: 'function',
    raw: printValue(path),
    signature: {
      arguments: [],
      return: getFlowType(path.get('returnType')),
    },
  };

  path.get('params').each(param => {
    const typeAnnotation = getTypeAnnotation(param);
    if (!typeAnnotation) return null;

    type.signature.arguments.push({
      name: getPropertyName(param.get('name')),
      type: getFlowType(typeAnnotation),
    });
  });

  return type;
}

function handleTupleTypeAnnotation(path: NodePath) {
  const type = { name: 'tuple', raw: printValue(path), elements: [] };

  path.get('types').each(param => {
    type.elements.push(getFlowType(param));
  });

  return type;
}

function handleTypeofTypeAnnotation(path: NodePath) {
  return getFlowType(path.get('argument'));
}

function handleQualifiedTypeIdentifier(path: NodePath) {
  if (path.node.qualification.name !== 'React') return;

  return { name: `React${path.node.id.name}`, raw: printValue(path) };
}

/**
 * Tries to identify the flow type by inspecting the path for known
 * flow type names. This method doesn't check whether the found type is actually
 * existing. It simply assumes that a match is always valid.
 *
 * If there is no match, "unknown" is returned.
 */
export default function getFlowType(path: NodePath): FlowTypeDescriptor {
  const node = path.node;
  let type: ?FlowTypeDescriptor;

  if (types.Type.check(node)) {
    if (node.type in flowTypes) {
      type = { name: flowTypes[node.type] };
    } else if (node.type in flowLiteralTypes) {
      type = { name: 'literal', value: node.raw || `${node.value}` };
    } else if (node.type in namedTypes) {
      type = namedTypes[node.type](path);
    }
  }

  if (!type) {
    type = { name: 'unknown' };
  }

  return type;
}
