import type { NodePath } from '@babel/traverse';
import type {
  AssignmentExpression,
  ClassMethod,
  ClassPrivateMethod,
  ClassProperty,
  FlowType,
  Function as FunctionType,
  ObjectMethod,
  ObjectProperty,
  TSType,
} from '@babel/types';
import { getDocblock } from './docblock.js';
import getFlowType from './getFlowType.js';
import getTSType from './getTSType.js';
import getParameterName from './getParameterName.js';
import getPropertyName from './getPropertyName.js';
import getTypeAnnotation from './getTypeAnnotation.js';
import resolveToValue from './resolveToValue.js';
import printValue from './printValue.js';
import type {
  MethodDescriptor,
  MethodModifier,
  MethodParameter,
  MethodReturn,
  TypeDescriptor,
} from '../Documentation.js';

export type MethodNodePath =
  | NodePath<AssignmentExpression>
  | NodePath<ClassMethod>
  | NodePath<ClassPrivateMethod>
  | NodePath<ClassProperty>
  | NodePath<ObjectMethod>
  | NodePath<ObjectProperty>;

function getMethodFunctionExpression(
  methodPath: MethodNodePath,
): NodePath<FunctionType> | null {
  if (methodPath.isClassMethod() || methodPath.isObjectMethod()) {
    return methodPath;
  }

  const potentialFunctionExpression = methodPath.isAssignmentExpression()
    ? methodPath.get('right')
    : (methodPath.get('value') as NodePath);

  const functionExpression = resolveToValue(potentialFunctionExpression);

  if (functionExpression.isFunction()) {
    return functionExpression;
  }

  return null;
}

function getMethodParamOptional(
  path: NodePath<FunctionType['params'][number]>,
): boolean {
  let identifier: NodePath = path;

  if (identifier.isTSParameterProperty()) {
    identifier = identifier.get('parameter');
  }
  if (identifier.isAssignmentPattern()) {
    // A default value always makes the param optional
    return true;
  }

  return identifier.isIdentifier() ? Boolean(identifier.node.optional) : false;
}

function getMethodParamsDoc(methodPath: MethodNodePath): MethodParameter[] {
  const params: MethodParameter[] = [];
  const functionExpression = getMethodFunctionExpression(methodPath);

  if (functionExpression) {
    // Extract param types.
    functionExpression.get('params').forEach((paramPath) => {
      let type: TypeDescriptor | null = null;
      const typePath = getTypeAnnotation<FlowType | TSType>(paramPath);

      if (typePath) {
        if (typePath.isFlowType()) {
          type = getFlowType(typePath, null);
          if (typePath.isGenericTypeAnnotation()) {
            type.alias = printValue(typePath.get('id'));
          }
        } else if (typePath.isTSType()) {
          type = getTSType(typePath, null);
          if (typePath.isTSTypeReference()) {
            type.alias = printValue(typePath.get('typeName'));
          }
        }
      }

      const param = {
        name: getParameterName(paramPath),
        optional: getMethodParamOptional(paramPath),
        type,
      };

      params.push(param);
    });
  }

  return params;
}

// Extract flow return type.
function getMethodReturnDoc(methodPath: MethodNodePath): MethodReturn | null {
  const functionExpression = getMethodFunctionExpression(methodPath);

  if (functionExpression && functionExpression.node.returnType) {
    const returnType = getTypeAnnotation(
      functionExpression.get('returnType') as NodePath,
    );

    if (returnType && returnType.isFlowType()) {
      return { type: getFlowType(returnType, null) };
    } else if (returnType) {
      return { type: getTSType(returnType, null) };
    }
  }

  return null;
}

function getMethodModifiers(
  methodPath: MethodNodePath,
  options: { isStatic?: boolean },
): MethodModifier[] {
  if (methodPath.isAssignmentExpression()) {
    return ['static'];
  }

  // Otherwise this is a method/property node

  const modifiers: MethodModifier[] = [];

  if (
    options.isStatic === true ||
    ((methodPath.isClassProperty() || methodPath.isClassMethod()) &&
      methodPath.node.static)
  ) {
    modifiers.push('static');
  }

  const functionExpression = getMethodFunctionExpression(methodPath);

  if (functionExpression) {
    if (
      functionExpression.isClassMethod() ||
      functionExpression.isObjectMethod()
    ) {
      if (
        functionExpression.node.kind === 'get' ||
        functionExpression.node.kind === 'set'
      ) {
        modifiers.push(functionExpression.node.kind);
      }
    }

    if (functionExpression.node.generator) {
      modifiers.push('generator');
    }
    if (functionExpression.node.async) {
      modifiers.push('async');
    }
  }

  return modifiers;
}

function getMethodName(
  methodPath: Exclude<MethodNodePath, NodePath<ClassPrivateMethod>>,
): string | null {
  if (methodPath.isAssignmentExpression()) {
    const left = methodPath.get('left');

    if (left.isMemberExpression()) {
      const property = left.get('property');

      if (!left.node.computed && property.isIdentifier()) {
        return property.node.name;
      }
      if (property.isStringLiteral() || property.isNumericLiteral()) {
        return String(property.node.value);
      }
    }

    return null;
  }

  return getPropertyName(methodPath);
}

function getMethodAccessibility(
  methodPath: MethodNodePath,
): 'private' | 'protected' | 'public' | null {
  if (methodPath.isClassMethod() || methodPath.isClassProperty()) {
    return methodPath.node.accessibility || null;
  }

  // Otherwise this is a object method/property or assignment expression
  return null;
}

function getMethodDocblock(methodPath: MethodNodePath): string | null {
  if (methodPath.isAssignmentExpression()) {
    let path: NodePath | null = methodPath;

    do {
      path = path.parentPath;
    } while (path && !path.isExpressionStatement());

    if (path) {
      return getDocblock(path);
    }

    return null;
  }

  // Otherwise this is a method/property node
  return getDocblock(methodPath);
}

// Gets the documentation object for a component method.
// Component methods may be represented as class/object method/property nodes
// or as assignment expression of the form `Component.foo = function() {}`
export default function getMethodDocumentation(
  methodPath: MethodNodePath,
  options: { isStatic?: boolean } = {},
): MethodDescriptor | null {
  if (
    getMethodAccessibility(methodPath) === 'private' ||
    methodPath.isClassPrivateMethod()
  ) {
    return null;
  }

  const name = getMethodName(methodPath);

  if (!name) return null;

  return {
    name,
    docblock: getMethodDocblock(methodPath),
    modifiers: getMethodModifiers(methodPath, options),
    params: getMethodParamsDoc(methodPath),
    returns: getMethodReturnDoc(methodPath),
  };
}
