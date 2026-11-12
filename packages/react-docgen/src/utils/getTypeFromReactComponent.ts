import type { NodePath } from '@babel/traverse';
import type Documentation from '../Documentation.js';
import getMemberValuePath from './getMemberValuePath.js';
import getTypeAnnotation from './getTypeAnnotation.js';
import getTypeParameters from './getTypeParameters.js';
import getTypeArguments from './getTypeArguments.js';
import isReactComponentClass from './isReactComponentClass.js';
import isReactForwardRefCall from './isReactForwardRefCall.js';
import resolveGenericTypeAnnotation from './resolveGenericTypeAnnotation.js';
import resolveToValue from './resolveToValue.js';
import type { TypeParameters } from './getTypeParameters.js';
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
  ClassDeclaration,
  ClassExpression,
  TypeParameterInstantiation,
  VariableDeclarator,
} from '@babel/types';
import getTypeIdentifier from './getTypeIdentifier.js';
import isReactBuiltinReference from './isReactBuiltinReference.js';
import unwrapBuiltinTSPropTypes from './unwrapBuiltinTSPropTypes.js';
import getTSPickOrOmit from './getTSPickOrOmit.js';
import getPropertyName from './getPropertyName.js';

function getStatelessPropsPath(
  componentDefinition: NodePath,
): NodePath | undefined {
  if (!componentDefinition.isFunction()) return;

  return componentDefinition.get('params')[0];
}

function getForwardRefGenericsType(
  componentDefinition: NodePath,
): NodePath<TSType> | null {
  const typeParameters = componentDefinition.get('typeParameters') as NodePath<
    TSTypeParameterInstantiation | null | undefined
  >;

  if (typeParameters && typeParameters.hasNode()) {
    const params = typeParameters.get('params');

    return params[1] ?? null;
  }

  return null;
}

function findAssignedVariableType(
  componentDefinition: NodePath,
): NodePath | null {
  const variableDeclarator = componentDefinition.findParent((path) =>
    path.isVariableDeclarator(),
  ) as NodePath<VariableDeclarator> | null;

  if (!variableDeclarator) return null;

  const typeAnnotation = getTypeAnnotation(variableDeclarator.get('id'));

  if (!typeAnnotation) return null;

  if (typeAnnotation.isTSTypeReference()) {
    const typeName = typeAnnotation.get('typeName');

    if (
      isReactBuiltinReference(typeName, 'FunctionComponent') ||
      isReactBuiltinReference(typeName, 'FC') ||
      isReactBuiltinReference(typeName, 'VoidFunctionComponent') ||
      isReactBuiltinReference(typeName, 'VFC')
    ) {
      const typeParameters = typeAnnotation.get('typeParameters');

      if (typeParameters.hasNode()) {
        return typeParameters.get('params')[0] ?? null;
      }
    }
  }

  return null;
}

/**
 * Finds the props type of a class extending a mixin call, e.g.
 * `class X extends withFoo(React.Component<Props>) {}`.
 */
function getMixinSuperClassPropsPath(
  classDefinition: NodePath<ClassDeclaration | ClassExpression>,
): NodePath | null {
  const superClass = classDefinition.get('superClass');

  if (!superClass.isCallExpression()) return null;

  const [baseClass] = superClass.get('arguments');

  if (!baseClass?.isTSInstantiationExpression()) return null;

  const expression = baseClass.get('expression');

  if (
    !isReactBuiltinReference(expression, 'Component') &&
    !isReactBuiltinReference(expression, 'PureComponent')
  ) {
    return null;
  }

  const typeParameters = getTypeArguments(baseClass);

  if (!typeParameters.hasNode()) return null;

  return typeParameters.get('params')[0] ?? null;
}

/**
 * Given an React component (stateless or class) tries to find
 * flow or TS types for the props. It may find multiple types.
 * If not found or it is not one of the supported component types,
 *  this function returns an empty array.
 */
export default (componentDefinition: NodePath): NodePath[] => {
  const typePaths: NodePath[] = [];

  if (isReactComponentClass(componentDefinition)) {
    const superTypes = componentDefinition.get('superTypeParameters');

    if (superTypes.hasNode()) {
      const params = superTypes.get('params');

      if (params.length >= 1) {
        const propsTypePath = params[params.length === 3 ? 1 : 0];

        if (propsTypePath) {
          typePaths.push(propsTypePath);
        }
      }
    } else {
      const mixinPropsPath = getMixinSuperClassPropsPath(componentDefinition);

      if (mixinPropsPath) {
        typePaths.push(mixinPropsPath);
      } else {
        const propsMemberPath = getMemberValuePath(
          componentDefinition,
          'props',
        );

        if (!propsMemberPath) {
          return [];
        }

        const typeAnnotation = getTypeAnnotation(propsMemberPath.parentPath);

        if (typeAnnotation) {
          typePaths.push(typeAnnotation);
        }
      }
    }
  } else {
    if (isReactForwardRefCall(componentDefinition)) {
      const genericTypeAnnotation =
        getForwardRefGenericsType(componentDefinition);

      if (genericTypeAnnotation) {
        typePaths.push(genericTypeAnnotation);
      }

      const [forwardRefArgument] = componentDefinition.get('arguments');

      if (forwardRefArgument) {
        componentDefinition = resolveToValue(forwardRefArgument);
      }
    }

    const propsParam = getStatelessPropsPath(componentDefinition);

    if (propsParam) {
      const typeAnnotation = getTypeAnnotation(propsParam);

      if (typeAnnotation) {
        typePaths.push(typeAnnotation);
      }
    }

    const assignedVariableType = findAssignedVariableType(componentDefinition);

    if (assignedVariableType) {
      typePaths.push(assignedVariableType);
    }
  }

  return typePaths.map((typePath) => unwrapBuiltinTSPropTypes(typePath));
};

/**
 * Returns the name of a TypeScript property or method signature, or null when
 * the member has no static name.
 */
function getTSMemberName(path: NodePath): string | null {
  if (!path.isTSPropertySignature() && !path.isTSMethodSignature()) {
    return null;
  }

  return getPropertyName(path);
}

/**
 * Binds the type arguments of a reference such as `Base<string>` to the type
 * parameters of the declaration it resolves to.
 */
function bindTypeArguments(
  referencePath: NodePath,
  resolvedPath: NodePath,
  typeParams: TypeParameters | null,
): TypeParameters | null {
  const typeArguments = getTypeArguments(referencePath);
  const typeParameters = resolvedPath.get('typeParameters') as NodePath<
    TSTypeParameterDeclaration | TypeParameterDeclaration | null | undefined
  >;

  if (typeParameters.hasNode() && typeArguments.hasNode()) {
    return getTypeParameters(typeParameters, typeArguments, typeParams);
  }

  return typeParams;
}

export function applyToTypeProperties(
  documentation: Documentation,
  path: NodePath,
  callback: (propertyPath: NodePath, params: TypeParameters | null) => void,
  typeParams: TypeParameters | null,
  visited = new WeakSet<object>(),
  ancestors = new WeakSet<object>(),
): void {
  if (visited.has(path.node) || ancestors.has(path.node)) return;
  visited.add(path.node);
  ancestors.add(path.node);

  try {
    applyToTypePropertiesOf(
      documentation,
      path,
      callback,
      typeParams,
      visited,
      ancestors,
    );
  } finally {
    ancestors.delete(path.node);
  }
}

function applyToTypePropertiesOf(
  documentation: Documentation,
  path: NodePath,
  callback: (propertyPath: NodePath, params: TypeParameters | null) => void,
  typeParams: TypeParameters | null,
  visited: WeakSet<object>,
  ancestors: WeakSet<object>,
): void {
  const pickOrOmit = getTSPickOrOmit(path);

  if (path.isObjectTypeAnnotation()) {
    path
      .get('properties')
      .forEach((propertyPath) => callback(propertyPath, typeParams));
  } else if (path.isTSTypeLiteral()) {
    path
      .get('members')
      .forEach((propertyPath) => callback(propertyPath, typeParams));
  } else if (path.isInterfaceDeclaration()) {
    applyExtends(documentation, path, callback, typeParams, visited, ancestors);

    path
      .get('body')
      .get('properties')
      .forEach((propertyPath) => callback(propertyPath, typeParams));
  } else if (path.isTSInterfaceDeclaration()) {
    applyExtends(documentation, path, callback, typeParams, visited, ancestors);

    path
      .get('body')
      .get('body')
      .forEach((propertyPath) => callback(propertyPath, typeParams));
  } else if (
    path.isIntersectionTypeAnnotation() ||
    path.isTSIntersectionType()
  ) {
    (path.get('types') as Array<NodePath<FlowType | TSType>>).forEach(
      (typesPath) =>
        applyToTypeProperties(
          documentation,
          typesPath,
          callback,
          typeParams,
          visited,
          ancestors,
        ),
    );
  } else if (pickOrOmit) {
    const { name, source, keys } = pickOrOmit;
    const resolvedSource = source.isTSTypeReference()
      ? resolveGenericTypeAnnotation(source)
      : undefined;

    // The source gets a new visited set, so that a type that is also used
    // elsewhere, as in `Pick<T, 'a'> & Omit<T, 'a'>`, is read again. Cycles
    // still stop at the types on the current path.
    applyToTypeProperties(
      documentation,
      resolvedSource ?? source,
      (propertyPath, params) => {
        const key = getTSMemberName(propertyPath);
        const selected = key !== null && keys.has(key);

        if (name === 'Pick' ? selected : !selected) {
          callback(propertyPath, params);
        }
      },
      resolvedSource?.isTSInterfaceDeclaration()
        ? bindTypeArguments(source, resolvedSource, typeParams)
        : typeParams,
      new WeakSet<object>(),
      ancestors,
    );
  } else if (!path.isUnionTypeAnnotation()) {
    // The react-docgen output format does not currently allow
    // for the expression of union types
    const typePath = resolveGenericTypeAnnotation(path);

    if (typePath) {
      applyToTypeProperties(
        documentation,
        typePath,
        callback,
        typeParams,
        visited,
        ancestors,
      );
    }
  }
}

function applyExtends(
  documentation: Documentation,
  path: NodePath<InterfaceDeclaration | TSInterfaceDeclaration>,
  callback: (propertyPath: NodePath, params: TypeParameters | null) => void,
  typeParams: TypeParameters | null,
  visited: WeakSet<object>,
  ancestors: WeakSet<object>,
): void {
  const classExtends = path.get('extends');

  if (!Array.isArray(classExtends)) {
    return;
  }

  classExtends.forEach(
    (
      extendsPath: NodePath<InterfaceExtends | TSExpressionWithTypeArguments>,
    ) => {
      const pickOrOmit = getTSPickOrOmit(extendsPath);

      if (pickOrOmit) {
        const { source } = pickOrOmit;

        if (
          source.isTSTypeReference() &&
          !resolveGenericTypeAnnotation(source)
        ) {
          // The picked type is not available, for example because it is
          // imported from another package.
          const idPath = getTypeIdentifier(source);

          if (idPath && idPath.isIdentifier()) {
            documentation.addComposes(idPath.node.name);
          }
        } else {
          applyToTypeProperties(
            documentation,
            extendsPath,
            callback,
            typeParams,
            visited,
            ancestors,
          );
        }

        return;
      }

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
        applyToTypeProperties(
          documentation,
          resolvedPath,
          callback,
          typeParams,
          visited,
          ancestors,
        );
      } else {
        const idPath = getTypeIdentifier(extendsPath);

        if (idPath && idPath.isIdentifier()) {
          documentation.addComposes(idPath.node.name);
        }
      }
    },
  );
}
