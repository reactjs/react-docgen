import { namedTypes as t } from 'ast-types';
import { getDocblock } from './docblock';
import getFlowType from './getFlowType';
import getTSType from './getTSType';
import getParameterName from './getParameterName';
import getPropertyName from './getPropertyName';
import getTypeAnnotation from './getTypeAnnotation';
import type { Importer } from '../parse';
import resolveToValue from './resolveToValue';
import {
  MethodDescriptor,
  MethodModifier,
  MethodParameter,
  MethodReturn,
  TypeDescriptor,
} from '../Documentation';
import type { NodePath } from 'ast-types/lib/node-path';

function getMethodFunctionExpression(
  methodPath: NodePath,
  importer: Importer,
): NodePath {
  const exprPath = t.AssignmentExpression.check(methodPath.node)
    ? methodPath.get('right')
    : methodPath.get('value');
  return resolveToValue(exprPath, importer);
}

function getMethodParamsDoc(
  methodPath: NodePath,
  importer: Importer,
): MethodParameter[] {
  const params: MethodParameter[] = [];
  const functionExpression = getMethodFunctionExpression(methodPath, importer);

  // Extract param flow types.
  functionExpression.get('params').each((paramPath: NodePath) => {
    let type: TypeDescriptor | null = null;
    const typePath = getTypeAnnotation(paramPath);
    if (typePath && t.Flow.check(typePath.node)) {
      type = getFlowType(typePath, null, importer);
      if (t.GenericTypeAnnotation.check(typePath.node)) {
        // @ts-ignore
        type.alias = typePath.node.id.name;
      }
    } else if (typePath) {
      type = getTSType(typePath, null, importer);
      if (t.TSTypeReference.check(typePath.node)) {
        // @ts-ignore
        type.alias = typePath.node.typeName.name;
      }
    }

    const param = {
      name: getParameterName(paramPath),
      optional: paramPath.node.optional,
      type,
    };

    params.push(param);
  });

  return params;
}

// Extract flow return type.
function getMethodReturnDoc(
  methodPath: NodePath,
  importer: Importer,
): MethodReturn | null {
  const functionExpression = getMethodFunctionExpression(methodPath, importer);

  if (functionExpression.node.returnType) {
    const returnType = getTypeAnnotation(functionExpression.get('returnType'));
    if (returnType && t.Flow.check(returnType.node)) {
      return { type: getFlowType(returnType, null, importer) };
    } else if (returnType) {
      return { type: getTSType(returnType, null, importer) };
    }
  }

  return null;
}

function getMethodModifiers(methodPath: NodePath): MethodModifier[] {
  if (t.AssignmentExpression.check(methodPath.node)) {
    return ['static'];
  }

  // Otherwise this is a method/property node

  const modifiers: MethodModifier[] = [];

  if (methodPath.node.static) {
    modifiers.push('static');
  }

  if (methodPath.node.kind === 'get' || methodPath.node.kind === 'set') {
    modifiers.push(methodPath.node.kind);
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

function getMethodName(
  methodPath: NodePath,
  importer: Importer,
): string | null {
  if (
    t.AssignmentExpression.check(methodPath.node) &&
    t.MemberExpression.check(methodPath.node.left)
  ) {
    const left = methodPath.node.left;
    const property = left.property;
    if (!left.computed) {
      // @ts-ignore
      return property.name;
    }
    if (t.Literal.check(property)) {
      return String(property.value);
    }
    return null;
  }
  return getPropertyName(methodPath, importer);
}

function getMethodAccessibility(
  methodPath: NodePath,
): null | 'public' | 'private' | 'protected' {
  if (t.AssignmentExpression.check(methodPath.node)) {
    return null;
  }

  // Otherwise this is a method/property node
  return methodPath.node.accessibility;
}

function getMethodDocblock(methodPath: NodePath): string | null {
  if (t.AssignmentExpression.check(methodPath.node)) {
    let path = methodPath;
    do {
      path = path.parent;
    } while (path && !t.ExpressionStatement.check(path.node));
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
// or as assignment expresions of the form `Component.foo = function() {}`
export default function getMethodDocumentation(
  methodPath: NodePath,
  importer: Importer,
): MethodDescriptor | null {
  if (getMethodAccessibility(methodPath) === 'private') {
    return null;
  }

  const name = getMethodName(methodPath, importer);
  if (!name) return null;

  return {
    name,
    docblock: getMethodDocblock(methodPath),
    modifiers: getMethodModifiers(methodPath),
    params: getMethodParamsDoc(methodPath, importer),
    returns: getMethodReturnDoc(methodPath, importer),
  };
}
