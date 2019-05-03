/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import getPropertyName from './getPropertyName';
import printValue from './printValue';
import recast from 'recast';
import getTypeAnnotation from '../utils/getTypeAnnotation';
import resolveToValue from '../utils/resolveToValue';
import { resolveObjectToNameArray } from '../utils/resolveObjectKeysToArray';
import getTypeParameters, {
  type TypeParameters,
} from '../utils/getTypeParameters';
import type {
  FlowTypeDescriptor,
  FlowElementsType,
  FlowFunctionSignatureType,
  FlowFunctionArgumentType,
  FlowObjectSignatureType,
} from '../types';

const {
  types: { namedTypes: types },
} = recast;

const tsTypes = {
  TSAnyKeyword: 'any',
  TSBooleanKeyword: 'boolean',
  TSUnknownKeyword: 'unknown',
  TSNeverKeyword: 'never',
  TSNullKeyword: 'null',
  TSUndefinedKeyword: 'undefined',
  TSNumberKeyword: 'number',
  TSStringKeyword: 'string',
  TSSymbolKeyword: 'symbol',
  TSThisType: 'this',
  TSObjectKeyword: 'object',
  TSVoidKeyword: 'void',
};

const namedTypes = {
  TSArrayType: handleTSArrayType,
  TSTypeReference: handleTSTypeReference,
  TSTypeLiteral: handleTSTypeLiteral,
  TSInterfaceDeclaration: handleTSInterfaceDeclaration,
  TSUnionType: handleTSUnionType,
  TSFunctionType: handleTSFunctionType,
  TSIntersectionType: handleTSIntersectionType,
  TSTupleType: handleTSTupleType,
  TSTypeQuery: handleTSTypeQuery,
  TSTypeOperator: handleTSTypeOperator,
};

function handleTSArrayType(
  path: NodePath,
  typeParams: ?TypeParameters,
): FlowElementsType {
  return {
    name: 'Array',
    elements: [getTSTypeWithResolvedTypes(path.get('elementType'), typeParams)],
    raw: printValue(path),
  };
}

function handleTSTypeReference(
  path: NodePath,
  typeParams: ?TypeParameters,
): ?FlowTypeDescriptor {
  let type: FlowTypeDescriptor;
  if (types.TSQualifiedName.check(path.node.typeName)) {
    const typeName = path.get('typeName');

    if (typeName.node.left.name === 'React') {
      type = {
        name: `${typeName.node.left.name}${typeName.node.right.name}`,
        raw: printValue(typeName),
      };
    } else {
      type = { name: printValue(typeName).replace(/<.*>$/, '') };
    }
  } else {
    type = { name: path.node.typeName.name };
  }

  const resolvedPath =
    (typeParams && typeParams[type.name]) ||
    resolveToValue(path.get('typeName'));

  if (path.node.typeParameters && resolvedPath.node.typeParameters) {
    typeParams = getTypeParameters(
      resolvedPath.get('typeParameters'),
      path.get('typeParameters'),
      typeParams,
    );
  }

  if (typeParams && typeParams[type.name]) {
    type = getTSTypeWithResolvedTypes(resolvedPath, typeParams);
  }

  if (resolvedPath && resolvedPath.node.typeAnnotation) {
    type = getTSTypeWithResolvedTypes(
      resolvedPath.get('typeAnnotation'),
      typeParams,
    );
  } else if (path.node.typeParameters) {
    const params = path.get('typeParameters').get('params');

    type = {
      ...type,
      elements: params.map(param =>
        getTSTypeWithResolvedTypes(param, typeParams),
      ),
      raw: printValue(path),
    };
  }

  return type;
}

function getTSTypeWithRequirements(
  path: NodePath,
  typeParams: ?TypeParameters,
): FlowTypeDescriptor {
  const type = getTSTypeWithResolvedTypes(path, typeParams);
  type.required = !path.parentPath.node.optional;
  return type;
}

function handleTSTypeLiteral(
  path: NodePath,
  typeParams: ?TypeParameters,
): FlowTypeDescriptor {
  const type: FlowObjectSignatureType = {
    name: 'signature',
    type: 'object',
    raw: printValue(path),
    signature: { properties: [] },
  };

  path.get('members').each(param => {
    if (
      types.TSPropertySignature.check(param.node) ||
      types.TSMethodSignature.check(param.node)
    ) {
      type.signature.properties.push({
        key: getPropertyName(param),
        value: getTSTypeWithRequirements(
          param.get('typeAnnotation'),
          typeParams,
        ),
      });
    } else if (types.TSCallSignatureDeclaration.check(param.node)) {
      type.signature.constructor = handleTSFunctionType(param, typeParams);
    } else if (types.TSIndexSignature.check(param.node)) {
      type.signature.properties.push({
        key: getTSTypeWithResolvedTypes(
          param
            .get('parameters')
            .get(0)
            .get('typeAnnotation'),
          typeParams,
        ),
        value: getTSTypeWithRequirements(
          param.get('typeAnnotation'),
          typeParams,
        ),
      });
    }
  });

  return type;
}

function handleTSInterfaceDeclaration(path: NodePath): FlowElementsType {
  // Interfaces are handled like references which would be documented separately,
  // rather than inlined like type aliases.
  return {
    name: path.node.id.name,
  };
}

function handleTSUnionType(
  path: NodePath,
  typeParams: ?TypeParameters,
): FlowElementsType {
  return {
    name: 'union',
    raw: printValue(path),
    elements: path
      .get('types')
      .map(subType => getTSTypeWithResolvedTypes(subType, typeParams)),
  };
}

function handleTSIntersectionType(
  path: NodePath,
  typeParams: ?TypeParameters,
): FlowElementsType {
  return {
    name: 'intersection',
    raw: printValue(path),
    elements: path
      .get('types')
      .map(subType => getTSTypeWithResolvedTypes(subType, typeParams)),
  };
}

function handleTSFunctionType(
  path: NodePath,
  typeParams: ?TypeParameters,
): FlowFunctionSignatureType {
  const type: FlowFunctionSignatureType = {
    name: 'signature',
    type: 'function',
    raw: printValue(path),
    signature: {
      arguments: [],
      return: getTSTypeWithResolvedTypes(
        path.get('typeAnnotation'),
        typeParams,
      ),
    },
  };

  path.get('parameters').each(param => {
    const typeAnnotation = getTypeAnnotation(param);
    const arg: FlowFunctionArgumentType = {
      name: param.node.name || '',
      type: typeAnnotation
        ? getTSTypeWithResolvedTypes(typeAnnotation, typeParams)
        : null,
    };

    if (param.node.name === 'this') {
      type.signature.this = arg.type;
      return;
    }

    if (param.node.type === 'RestElement') {
      arg.name = param.node.argument.name;
      arg.rest = true;
    }

    type.signature.arguments.push(arg);
  });

  return type;
}

function handleTSTupleType(
  path: NodePath,
  typeParams: ?TypeParameters,
): FlowElementsType {
  const type: FlowElementsType = {
    name: 'tuple',
    raw: printValue(path),
    elements: [],
  };

  path.get('elementTypes').each(param => {
    type.elements.push(getTSTypeWithResolvedTypes(param, typeParams));
  });

  return type;
}

function handleTSTypeQuery(
  path: NodePath,
  typeParams: ?TypeParameters,
): FlowTypeDescriptor {
  const resolvedPath = resolveToValue(path.get('exprName'));
  if (resolvedPath && resolvedPath.node.typeAnnotation) {
    return getTSTypeWithResolvedTypes(
      resolvedPath.get('typeAnnotation'),
      typeParams,
    );
  }

  return { name: path.node.exprName.name };
}

function handleTSTypeOperator(path: NodePath): FlowTypeDescriptor {
  if (path.node.operator !== 'keyof') {
    return null;
  }

  let value = path.get('typeAnnotation');
  if (types.TSTypeQuery.check(value.node)) {
    value = value.get('exprName');
  } else if (value.node.id) {
    value = value.get('id');
  }

  const resolvedPath = resolveToValue(value);
  if (
    resolvedPath &&
    (types.ObjectExpression.check(resolvedPath.node) ||
      types.TSTypeLiteral.check(resolvedPath.node))
  ) {
    const keys = resolveObjectToNameArray(resolvedPath, true);

    if (keys) {
      return {
        name: 'union',
        raw: printValue(path),
        elements: keys.map(key => ({ name: 'literal', value: key })),
      };
    }
  }
}

let visitedTypes = {};

function getTSTypeWithResolvedTypes(
  path: NodePath,
  typeParams: ?TypeParameters,
): FlowTypeDescriptor {
  if (types.TSTypeAnnotation.check(path.node)) {
    path = path.get('typeAnnotation');
  }

  const node = path.node;
  let type: ?FlowTypeDescriptor;
  const isTypeAlias = types.TSTypeAliasDeclaration.check(path.parentPath.node);

  // When we see a typealias mark it as visited so that the next
  // call of this function does not run into an endless loop
  if (isTypeAlias) {
    if (visitedTypes[path.parentPath.node.id.name] === true) {
      // if we are currently visiting this node then just return the name
      // as we are starting to endless loop
      return { name: path.parentPath.node.id.name };
    } else if (typeof visitedTypes[path.parentPath.node.id.name] === 'object') {
      // if we already resolved the type simple return it
      return visitedTypes[path.parentPath.node.id.name];
    }
    // mark the type as visited
    visitedTypes[path.parentPath.node.id.name] = true;
  }

  if (node.type in tsTypes) {
    type = { name: tsTypes[node.type] };
  } else if (types.TSLiteralType.check(node)) {
    type = {
      name: 'literal',
      value: node.literal.raw || `${node.literal.value}`,
    };
  } else if (node.type in namedTypes) {
    type = namedTypes[node.type](path, typeParams);
  }

  if (!type) {
    type = { name: 'unknown' };
  }

  if (isTypeAlias) {
    // mark the type as unvisited so that further calls can resolve the type again
    visitedTypes[path.parentPath.node.id.name] = type;
  }

  return type;
}

/**
 * Tries to identify the typescript type by inspecting the path for known
 * typescript type names. This method doesn't check whether the found type is actually
 * existing. It simply assumes that a match is always valid.
 *
 * If there is no match, "unknown" is returned.
 */
export default function getTSType(
  path: NodePath,
  typeParamMap: ?TypeParameters,
): FlowTypeDescriptor {
  // Empty visited types before an after run
  // Before: in case the detection threw and we rerun again
  // After: cleanup memory after we are done here
  visitedTypes = {};
  const type = getTSTypeWithResolvedTypes(path, typeParamMap);
  visitedTypes = {};

  return type;
}
