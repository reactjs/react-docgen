import getPropertyName from './getPropertyName';
import printValue from './printValue';
import getTypeAnnotation from '../utils/getTypeAnnotation';
import resolveToValue from '../utils/resolveToValue';
import { resolveObjectToNameArray } from '../utils/resolveObjectKeysToArray';
import type { TypeParameters } from '../utils/getTypeParameters';
import getTypeParameters from '../utils/getTypeParameters';
import type {
  ElementsType,
  FunctionSignatureType,
  ObjectSignatureType,
  SimpleType,
  TypeDescriptor,
} from '../Documentation';
import type { NodePath } from '@babel/traverse';
import type {
  ArrayTypeAnnotation,
  BooleanLiteralTypeAnnotation,
  FlowType,
  FunctionTypeAnnotation,
  GenericTypeAnnotation,
  Identifier,
  InterfaceDeclaration,
  IntersectionTypeAnnotation,
  NullableTypeAnnotation,
  NumberLiteralTypeAnnotation,
  ObjectTypeAnnotation,
  StringLiteralTypeAnnotation,
  TupleTypeAnnotation,
  TypeofTypeAnnotation,
  TypeParameterDeclaration,
  UnionTypeAnnotation,
} from '@babel/types';

const flowTypes = {
  AnyTypeAnnotation: 'any',
  BooleanTypeAnnotation: 'boolean',
  MixedTypeAnnotation: 'mixed',
  NullLiteralTypeAnnotation: 'null',
  NumberTypeAnnotation: 'number',
  StringTypeAnnotation: 'string',
  VoidTypeAnnotation: 'void',
  EmptyTypeAnnotation: 'empty',
};

const flowLiteralTypes = {
  BooleanLiteralTypeAnnotation: 1,
  NumberLiteralTypeAnnotation: 1,
  StringLiteralTypeAnnotation: 1,
};

const namedTypes = {
  ArrayTypeAnnotation: handleArrayTypeAnnotation,
  GenericTypeAnnotation: handleGenericTypeAnnotation,
  ObjectTypeAnnotation: handleObjectTypeAnnotation,
  InterfaceDeclaration: handleInterfaceDeclaration,
  UnionTypeAnnotation: handleUnionTypeAnnotation,
  NullableTypeAnnotation: handleNullableTypeAnnotation,
  FunctionTypeAnnotation: handleFunctionTypeAnnotation,
  IntersectionTypeAnnotation: handleIntersectionTypeAnnotation,
  TupleTypeAnnotation: handleTupleTypeAnnotation,
  TypeofTypeAnnotation: handleTypeofTypeAnnotation,
};

function getFlowTypeWithRequirements(
  path: NodePath<FlowType>,
  typeParams: TypeParameters | null,
): TypeDescriptor {
  const type = getFlowTypeWithResolvedTypes(path, typeParams);

  type.required =
    'optional' in path.parentPath.node ? !path.parentPath.node.optional : true;

  return type;
}

function handleKeysHelper(
  path: NodePath<GenericTypeAnnotation>,
): ElementsType | null {
  let value = path.get('typeParameters').get('params')[0];

  if (value.isTypeofTypeAnnotation()) {
    value = value.get('argument').get('id');
  } else if (!value.isObjectTypeAnnotation()) {
    value = value.get('id');
  }
  const resolvedPath = resolveToValue(value);

  if (
    resolvedPath &&
    (resolvedPath.isObjectExpression() || resolvedPath.isObjectTypeAnnotation())
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

  return null;
}

function handleArrayTypeAnnotation(
  path: NodePath<ArrayTypeAnnotation>,
  typeParams: TypeParameters | null,
): ElementsType {
  return {
    name: 'Array',
    elements: [
      getFlowTypeWithResolvedTypes(path.get('elementType'), typeParams),
    ],
    raw: printValue(path),
  };
}

function handleGenericTypeAnnotation(
  path: NodePath<GenericTypeAnnotation>,
  typeParams: TypeParameters | null,
): TypeDescriptor | null {
  const id = path.get('id');
  const typeParameters = path.get('typeParameters');

  if (
    id.isIdentifier() &&
    id.node.name === '$Keys' &&
    typeParameters.hasNode()
  ) {
    return handleKeysHelper(path);
  }

  let type: TypeDescriptor;

  if (id.isQualifiedTypeIdentifier()) {
    const qualification = id.get('qualification');

    if (qualification.isIdentifier() && qualification.node.name === 'React') {
      type = {
        name: `${qualification.node.name}${id.node.id.name}`,
        raw: printValue(id),
      };
    } else {
      type = { name: printValue(id).replace(/<.*>$/, '') };
    }
  } else {
    type = { name: (id as NodePath<Identifier>).node.name };
  }

  const resolvedPath =
    (typeParams && typeParams[type.name]) || resolveToValue(path.get('id'));

  if (typeParameters.hasNode() && resolvedPath.has('typeParameters')) {
    typeParams = getTypeParameters(
      resolvedPath.get('typeParameters') as NodePath<TypeParameterDeclaration>,
      typeParameters,
      typeParams,
    );
  }

  if (
    typeParams &&
    typeParams[type.name] &&
    typeParams[type.name].isGenericTypeAnnotation()
  ) {
    return type;
  }

  if (typeParams && typeParams[type.name]) {
    type = getFlowTypeWithResolvedTypes(
      resolvedPath as NodePath<FlowType>,
      typeParams,
    );
  }

  if (resolvedPath && resolvedPath.has('right')) {
    type = getFlowTypeWithResolvedTypes(
      resolvedPath.get('right') as NodePath<FlowType>,
      typeParams,
    );
  } else if (typeParameters.hasNode()) {
    const params = typeParameters.get('params');

    type = {
      ...(type as SimpleType),
      elements: params.map(param =>
        getFlowTypeWithResolvedTypes(param, typeParams),
      ),
      raw: printValue(path),
    };
  }

  return type;
}

function handleObjectTypeAnnotation(
  path: NodePath<ObjectTypeAnnotation>,
  typeParams: TypeParameters | null,
): TypeDescriptor {
  const type: ObjectSignatureType = {
    name: 'signature',
    type: 'object',
    raw: printValue(path),
    signature: { properties: [] },
  };

  const callProperties = path.get('callProperties');

  if (Array.isArray(callProperties)) {
    callProperties.forEach(param => {
      type.signature.constructor = getFlowTypeWithResolvedTypes(
        param.get('value'),
        typeParams,
      );
    });
  }

  const indexers = path.get('indexers');

  if (Array.isArray(indexers)) {
    indexers.forEach(param => {
      type.signature.properties.push({
        key: getFlowTypeWithResolvedTypes(param.get('key'), typeParams),
        value: getFlowTypeWithRequirements(param.get('value'), typeParams),
      });
    });
  }

  path.get('properties').forEach(param => {
    if (param.isObjectTypeProperty()) {
      type.signature.properties.push({
        // For ObjectTypeProperties `getPropertyName` always returns string
        key: getPropertyName(param) as string,
        value: getFlowTypeWithRequirements(param.get('value'), typeParams),
      });
    } else if (param.isObjectTypeSpreadProperty()) {
      let spreadObject = resolveToValue(param.get('argument'));

      if (spreadObject.isGenericTypeAnnotation()) {
        const typeAlias = resolveToValue(spreadObject.get('id'));

        if (
          typeAlias.isTypeAlias() &&
          typeAlias.get('right').isObjectTypeAnnotation()
        ) {
          spreadObject = resolveToValue(typeAlias.get('right'));
        }
      }

      if (spreadObject.isObjectTypeAnnotation()) {
        const props = handleObjectTypeAnnotation(
          spreadObject,
          typeParams,
        ) as ObjectSignatureType;

        type.signature.properties.push(...props.signature.properties);
      }
    }
  });

  return type;
}

function handleInterfaceDeclaration(
  path: NodePath<InterfaceDeclaration>,
): SimpleType {
  // Interfaces are handled like references which would be documented separately,
  // rather than inlined like type aliases.
  return {
    name: path.node.id.name,
  };
}

function handleUnionTypeAnnotation(
  path: NodePath<UnionTypeAnnotation>,
  typeParams: TypeParameters | null,
): ElementsType {
  return {
    name: 'union',
    raw: printValue(path),
    elements: path
      .get('types')
      .map(subType => getFlowTypeWithResolvedTypes(subType, typeParams)),
  };
}

function handleIntersectionTypeAnnotation(
  path: NodePath<IntersectionTypeAnnotation>,
  typeParams: TypeParameters | null,
): ElementsType {
  return {
    name: 'intersection',
    raw: printValue(path),
    elements: path
      .get('types')
      .map(subType => getFlowTypeWithResolvedTypes(subType, typeParams)),
  };
}

function handleNullableTypeAnnotation(
  path: NodePath<NullableTypeAnnotation>,
  typeParams: TypeParameters | null,
): TypeDescriptor | null {
  const typeAnnotation = getTypeAnnotation(path);

  if (!typeAnnotation) return null;

  const type = getFlowTypeWithResolvedTypes(typeAnnotation, typeParams);

  type.nullable = true;

  return type;
}

function handleFunctionTypeAnnotation(
  path: NodePath<FunctionTypeAnnotation>,
  typeParams: TypeParameters | null,
): FunctionSignatureType {
  const type: FunctionSignatureType = {
    name: 'signature',
    type: 'function',
    raw: printValue(path),
    signature: {
      arguments: [],
      return: getFlowTypeWithResolvedTypes(path.get('returnType'), typeParams),
    },
  };

  path.get('params').forEach(param => {
    const typeAnnotation = getTypeAnnotation(param);

    type.signature.arguments.push({
      name: param.node.name ? param.node.name.name : '',
      type: typeAnnotation
        ? getFlowTypeWithResolvedTypes(typeAnnotation, typeParams)
        : undefined,
    });
  });

  const rest = path.get('rest');

  if (rest.hasNode()) {
    const typeAnnotation = getTypeAnnotation(rest);

    type.signature.arguments.push({
      name: rest.node.name ? rest.node.name.name : '',
      type: typeAnnotation
        ? getFlowTypeWithResolvedTypes(typeAnnotation, typeParams)
        : undefined,
      rest: true,
    });
  }

  return type;
}

function handleTupleTypeAnnotation(
  path: NodePath<TupleTypeAnnotation>,
  typeParams: TypeParameters | null,
): ElementsType {
  const type: ElementsType = {
    name: 'tuple',
    raw: printValue(path),
    elements: [],
  };

  path.get('types').forEach(param => {
    type.elements.push(getFlowTypeWithResolvedTypes(param, typeParams));
  });

  return type;
}

function handleTypeofTypeAnnotation(
  path: NodePath<TypeofTypeAnnotation>,
  typeParams: TypeParameters | null,
): TypeDescriptor {
  return getFlowTypeWithResolvedTypes(path.get('argument'), typeParams);
}

let visitedTypes = {};

function getFlowTypeWithResolvedTypes(
  path: NodePath<FlowType>,
  typeParams: TypeParameters | null,
): TypeDescriptor {
  let type: TypeDescriptor | null = null;
  const parent = path.parentPath;

  const isTypeAlias = parent.isTypeAlias();

  // When we see a typealias mark it as visited so that the next
  // call of this function does not run into an endless loop
  if (isTypeAlias) {
    if (visitedTypes[parent.node.id.name] === true) {
      // if we are currently visiting this node then just return the name
      // as we are starting to endless loop
      return { name: parent.node.id.name };
    } else if (typeof visitedTypes[parent.node.id.name] === 'object') {
      // if we already resolved the type simple return it
      return visitedTypes[parent.node.id.name];
    }
    // mark the type as visited
    visitedTypes[parent.node.id.name] = true;
  }

  if (path.node.type in flowTypes) {
    type = { name: flowTypes[path.node.type] };
  } else if (path.node.type in flowLiteralTypes) {
    type = {
      name: 'literal',
      value:
        (path.node.extra?.raw as string) ||
        `${
          (
            path as NodePath<
              | BooleanLiteralTypeAnnotation
              | NumberLiteralTypeAnnotation
              | StringLiteralTypeAnnotation
            >
          ).node.value
        }`,
    };
  } else if (path.node.type in namedTypes) {
    type = namedTypes[path.node.type](path, typeParams);
  }

  if (!type) {
    type = { name: 'unknown' };
  }

  if (isTypeAlias) {
    // mark the type as unvisited so that further calls can resolve the type again
    visitedTypes[parent.node.id.name] = type;
  }

  return type;
}

/**
 * Tries to identify the flow type by inspecting the path for known
 * flow type names. This method doesn't check whether the found type is actually
 * existing. It simply assumes that a match is always valid.
 *
 * If there is no match, "unknown" is returned.
 */
export default function getFlowType(
  path: NodePath<FlowType>,
  typeParams: TypeParameters | null = null,
): TypeDescriptor {
  // Empty visited types before an after run
  // Before: in case the detection threw and we rerun again
  // After: cleanup memory after we are done here
  visitedTypes = {};
  const type = getFlowTypeWithResolvedTypes(path, typeParams);

  visitedTypes = {};

  return type;
}
