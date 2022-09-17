import type { NodePath } from '@babel/traverse';
import type Documentation from '../Documentation';
import getMemberValuePath from './getMemberValuePath';
import getTypeAnnotation from './getTypeAnnotation';
import getTypeParameters from './getTypeParameters';
import isReactComponentClass from './isReactComponentClass';
import isReactForwardRefCall from './isReactForwardRefCall';
import resolveGenericTypeAnnotation from './resolveGenericTypeAnnotation';
import resolveToValue from './resolveToValue';
import type { TypeParameters } from './getTypeParameters';
import type {
  FlowType,
  InterfaceDeclaration,
  InterfaceExtends,
  TSExpressionWithTypeArguments,
  TSInterfaceDeclaration,
  TSType,
  TSTypeParameterDeclaration,
  TSTypeParameterInstantiation,
  TypeParameterDeclaration,
  TypeParameterInstantiation,
  ClassDeclaration,
  ClassExpression,
} from '@babel/types';
import getTypeIdentifier from './getTypeIdentifier';

// TODO TESTME

function getStatelessPropsPath(componentDefinition: NodePath): NodePath {
  const value = resolveToValue(componentDefinition);

  if (isReactForwardRefCall(value)) {
    const inner = resolveToValue(value.get('arguments')[0]);

    return inner.get('params')[0];
  }

  return value.get('params')[0];
}

function isInheritedFromHoc(
  path: NodePath<ClassDeclaration | ClassExpression>,
): boolean {
  const superClass = path.get('superClass');

  if (superClass.isCallExpression()) {
    return true;
  } else return false;
}

function propTypeFromInheritedHoc(
  path: NodePath<ClassDeclaration | ClassExpression>,
): NodePath | null {
  const parent = path.get('superClass.arguments')[0];

  if (parent.hasNode()) {
    const typeParams = parent.get('typeParameters');

    if (typeParams.hasNode()) {
      const typeParam = typeParams.get('params.0');

      if (
        !Array.isArray(typeParam) &&
        typeParam.hasNode() &&
        typeParam.isTSTypeReference()
      ) {
        return typeParam;
      }
    }
  }

  return null;
}

/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns null.
 */
export default (path: NodePath): NodePath | null => {
  let typePath: NodePath | null = null;

  if (isReactComponentClass(path)) {
    const superTypes = path.get('superTypeParameters');

    if (superTypes.hasNode()) {
      const params = superTypes.get('params');

      typePath = params[params.length === 3 ? 1 : 0];
    } else {
      if (isInheritedFromHoc(path)) {
        typePath = propTypeFromInheritedHoc(path);
        if (typePath) {
          return typePath;
        }
      }
      const propsMemberPath = getMemberValuePath(path, 'props');

      if (!propsMemberPath) {
        return null;
      }

      typePath = getTypeAnnotation(propsMemberPath.parentPath);
    }

    return typePath;
  }

  const propsParam = getStatelessPropsPath(path);

  if (propsParam) {
    typePath = getTypeAnnotation(propsParam);
  }

  return typePath;
};

export function applyToTypeProperties(
  documentation: Documentation,
  path: NodePath,
  callback: (propertyPath: NodePath, params: TypeParameters | null) => void,
  typeParams: TypeParameters | null,
): void {
  if (path.isObjectTypeAnnotation()) {
    path
      .get('properties')
      .forEach(propertyPath => callback(propertyPath, typeParams));
  } else if (path.isTSTypeLiteral()) {
    path
      .get('members')
      .forEach(propertyPath => callback(propertyPath, typeParams));
  } else if (path.isInterfaceDeclaration()) {
    if (path.node.extends) {
      applyExtends(documentation, path, callback, typeParams);
    }

    path
      .get('body')
      .get('properties')
      .forEach(propertyPath => callback(propertyPath, typeParams));
  } else if (path.isTSInterfaceDeclaration()) {
    if (path.node.extends) {
      applyExtends(documentation, path, callback, typeParams);
    }

    path
      .get('body')
      .get('body')
      .forEach(propertyPath => callback(propertyPath, typeParams));
  } else if (
    path.isIntersectionTypeAnnotation() ||
    path.isTSIntersectionType()
  ) {
    (path.get('types') as Array<NodePath<FlowType | TSType>>).forEach(
      typesPath =>
        applyToTypeProperties(documentation, typesPath, callback, typeParams),
    );
  } else if (!path.isUnionTypeAnnotation()) {
    // The react-docgen output format does not currently allow
    // for the expression of union types
    const typePath = resolveGenericTypeAnnotation(path);

    if (typePath) {
      applyToTypeProperties(documentation, typePath, callback, typeParams);
    }
  }
}

function applyExtends(
  documentation: Documentation,
  path: NodePath<InterfaceDeclaration | TSInterfaceDeclaration>,
  callback: (propertyPath: NodePath, params: TypeParameters | null) => void,
  typeParams: TypeParameters | null,
) {
  (
    path.get('extends') as Array<
      NodePath<InterfaceExtends | TSExpressionWithTypeArguments>
    >
  ).forEach(extendsPath => {
    const resolvedPath = resolveGenericTypeAnnotation(extendsPath);

    if (resolvedPath) {
      if (
        resolvedPath.has('typeParameters') &&
        extendsPath.node.typeParameters
      ) {
        typeParams = getTypeParameters(
          resolvedPath.get('typeParameters') as NodePath<
            TSTypeParameterDeclaration | TypeParameterDeclaration
          >,
          extendsPath.get('typeParameters') as NodePath<
            TSTypeParameterInstantiation | TypeParameterInstantiation
          >,
          typeParams,
        );
      }
      applyToTypeProperties(documentation, resolvedPath, callback, typeParams);
    } else {
      const idPath = getTypeIdentifier(extendsPath);

      if (idPath && idPath.isIdentifier()) {
        documentation.addComposes(idPath.node.name);
      }
    }
  });
}
