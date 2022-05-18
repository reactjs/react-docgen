import { namedTypes as t } from 'ast-types';
import getPropertyName from './getPropertyName';
import printValue from './printValue';
import getTypeAnnotation from '../utils/getTypeAnnotation';
import resolveToValue from '../utils/resolveToValue';
import { resolveObjectToNameArray } from '../utils/resolveObjectKeysToArray';
import getTypeParameters, { TypeParameters } from '../utils/getTypeParameters';
import type { Importer } from '../parse';
import type {
  ElementsType,
  FunctionSignatureType,
  ObjectSignatureType,
  SimpleType,
  TypeDescriptor,
} from '../Documentation';
import type { NodePath } from 'ast-types/lib/node-path';

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
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): TypeDescriptor {
  const type = getFlowTypeWithResolvedTypes(path, typeParams, importer);

  type.required = !path.parentPath.node.optional;

  return type;
}

function handleKeysHelper(
  path: NodePath,
  importer: Importer,
): ElementsType | null {
  let value = path.get('typeParameters', 'params', 0);
  if (t.TypeofTypeAnnotation.check(value.node)) {
    value = value.get('argument', 'id');
  } else if (!t.ObjectTypeAnnotation.check(value.node)) {
    value = value.get('id');
  }
  const resolvedPath = resolveToValue(value, importer);
  if (
    resolvedPath &&
    (t.ObjectExpression.check(resolvedPath.node) ||
      t.ObjectTypeAnnotation.check(resolvedPath.node))
  ) {
    const keys = resolveObjectToNameArray(resolvedPath, importer, true);

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
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): ElementsType {
  return {
    name: 'Array',
    elements: [
      getFlowTypeWithResolvedTypes(
        path.get('elementType'),
        typeParams,
        importer,
      ),
    ],
    raw: printValue(path),
  };
}

function handleGenericTypeAnnotation(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): TypeDescriptor | null {
  if (path.node.id.name === '$Keys' && path.node.typeParameters) {
    return handleKeysHelper(path, importer);
  }

  let type: TypeDescriptor;
  if (t.QualifiedTypeIdentifier.check(path.node.id)) {
    const id = path.get('id');

    if (id.node.qualification.name === 'React') {
      type = {
        name: `${id.node.qualification.name}${id.node.id.name}`,
        raw: printValue(id),
      };
    } else {
      type = { name: printValue(id).replace(/<.*>$/, '') };
    }
  } else {
    type = { name: path.node.id.name };
  }

  const resolvedPath =
    (typeParams && typeParams[type.name]) ||
    resolveToValue(path.get('id'), importer);

  if (path.node.typeParameters && resolvedPath.node.typeParameters) {
    typeParams = getTypeParameters(
      resolvedPath.get('typeParameters'),
      path.get('typeParameters'),
      typeParams,
      importer,
    );
  }

  if (
    typeParams &&
    typeParams[type.name] &&
    // @ts-ignore
    typeParams[type.name].value.type === t.GenericTypeAnnotation.name
  ) {
    return type;
  }

  if (typeParams && typeParams[type.name]) {
    type = getFlowTypeWithResolvedTypes(resolvedPath, typeParams, importer);
  }

  if (resolvedPath && resolvedPath.node.right) {
    type = getFlowTypeWithResolvedTypes(
      resolvedPath.get('right'),
      typeParams,
      importer,
    );
  } else if (path.node.typeParameters) {
    const params = path.get('typeParameters').get('params');

    type = {
      ...(type as SimpleType),
      elements: params.map((param: NodePath) =>
        getFlowTypeWithResolvedTypes(param, typeParams, importer),
      ),
      raw: printValue(path),
    };
  }

  return type;
}

function handleObjectTypeAnnotation(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): TypeDescriptor {
  const type: ObjectSignatureType = {
    name: 'signature',
    type: 'object',
    raw: printValue(path),
    signature: { properties: [] },
  };

  path.get('callProperties').each(param => {
    type.signature.constructor = getFlowTypeWithResolvedTypes(
      param.get('value'),
      typeParams,
      importer,
    );
  });

  path.get('indexers').each(param => {
    type.signature.properties.push({
      key: getFlowTypeWithResolvedTypes(param.get('key'), typeParams, importer),
      value: getFlowTypeWithRequirements(
        param.get('value'),
        typeParams,
        importer,
      ),
    });
  });

  path.get('properties').each(param => {
    if (t.ObjectTypeProperty.check(param.node)) {
      type.signature.properties.push({
        // For ObjectTypeProperties `getPropertyName` always returns string
        key: getPropertyName(param, importer) as string,
        value: getFlowTypeWithRequirements(
          param.get('value'),
          typeParams,
          importer,
        ),
      });
    } else if (t.ObjectTypeSpreadProperty.check(param.node)) {
      let spreadObject = resolveToValue(param.get('argument'), importer);
      if (t.GenericTypeAnnotation.check(spreadObject.value)) {
        const typeAlias = resolveToValue(spreadObject.get('id'), importer);
        if (t.ObjectTypeAnnotation.check(typeAlias.get('right').value)) {
          spreadObject = resolveToValue(typeAlias.get('right'), importer);
        }
      }
      const props = handleObjectTypeAnnotation(
        spreadObject,
        typeParams,
        importer,
      ) as ObjectSignatureType;
      type.signature.properties.push(...props.signature.properties);
    }
  });

  return type;
}

function handleInterfaceDeclaration(path: NodePath): SimpleType {
  // Interfaces are handled like references which would be documented separately,
  // rather than inlined like type aliases.
  return {
    name: path.node.id.name,
  };
}

function handleUnionTypeAnnotation(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): ElementsType {
  return {
    name: 'union',
    raw: printValue(path),
    elements: path
      .get('types')
      .map(subType =>
        getFlowTypeWithResolvedTypes(subType, typeParams, importer),
      ),
  };
}

function handleIntersectionTypeAnnotation(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): ElementsType {
  return {
    name: 'intersection',
    raw: printValue(path),
    elements: path
      .get('types')
      .map(subType =>
        getFlowTypeWithResolvedTypes(subType, typeParams, importer),
      ),
  };
}

function handleNullableTypeAnnotation(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): TypeDescriptor | null {
  const typeAnnotation = getTypeAnnotation(path);

  if (!typeAnnotation) return null;

  const type = getFlowTypeWithResolvedTypes(
    typeAnnotation,
    typeParams,
    importer,
  );
  type.nullable = true;

  return type;
}

function handleFunctionTypeAnnotation(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): FunctionSignatureType {
  const type: FunctionSignatureType = {
    name: 'signature',
    type: 'function',
    raw: printValue(path),
    signature: {
      arguments: [],
      return: getFlowTypeWithResolvedTypes(
        path.get('returnType'),
        typeParams,
        importer,
      ),
    },
  };

  path.get('params').each(param => {
    const typeAnnotation = getTypeAnnotation(param);

    type.signature.arguments.push({
      name: param.node.name ? param.node.name.name : '',
      type: typeAnnotation
        ? getFlowTypeWithResolvedTypes(typeAnnotation, typeParams, importer)
        : undefined,
    });
  });

  if (path.node.rest) {
    const rest = path.get('rest');
    const typeAnnotation = getTypeAnnotation(rest);

    type.signature.arguments.push({
      name: rest.node.name ? rest.node.name.name : '',
      type: typeAnnotation
        ? getFlowTypeWithResolvedTypes(typeAnnotation, typeParams, importer)
        : undefined,
      rest: true,
    });
  }

  return type;
}

function handleTupleTypeAnnotation(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): ElementsType {
  const type: ElementsType = {
    name: 'tuple',
    raw: printValue(path),
    elements: [],
  };

  path.get('types').each(param => {
    type.elements.push(
      getFlowTypeWithResolvedTypes(param, typeParams, importer),
    );
  });

  return type;
}

function handleTypeofTypeAnnotation(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): TypeDescriptor {
  return getFlowTypeWithResolvedTypes(
    path.get('argument'),
    typeParams,
    importer,
  );
}

let visitedTypes = {};

function getFlowTypeWithResolvedTypes(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): TypeDescriptor {
  const node = path.node;
  let type: TypeDescriptor | null = null;

  const isTypeAlias = t.TypeAlias.check(path.parentPath.node);
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

  if (node.type in flowTypes) {
    type = { name: flowTypes[node.type] };
  } else if (node.type in flowLiteralTypes) {
    type = { name: 'literal', value: node.raw || `${node.value}` };
  } else if (node.type in namedTypes) {
    type = namedTypes[node.type](path, typeParams, importer);
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
 * Tries to identify the flow type by inspecting the path for known
 * flow type names. This method doesn't check whether the found type is actually
 * existing. It simply assumes that a match is always valid.
 *
 * If there is no match, "unknown" is returned.
 */
export default function getFlowType(
  path: NodePath,
  typeParams: TypeParameters | null,
  importer: Importer,
): TypeDescriptor {
  // Empty visited types before an after run
  // Before: in case the detection threw and we rerun again
  // After: cleanup memory after we are done here
  visitedTypes = {};
  const type = getFlowTypeWithResolvedTypes(path, typeParams, importer);
  visitedTypes = {};

  return type;
}
