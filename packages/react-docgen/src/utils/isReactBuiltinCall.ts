import isReactModuleName from './isReactModuleName.js';
import resolveToModule from './resolveToModule.js';
import resolveToValue from './resolveToValue.js';
import isDestructuringAssignment from './isDestructuringAssignment.js';
import type { NodePath } from '@babel/traverse';
import type { CallExpression } from '@babel/types';

function isNamedMemberExpression(value: NodePath, name: string): boolean {
  if (!value.isMemberExpression()) {
    return false;
  }

  const property = value.get('property');

  return property.isIdentifier() && property.node.name === name;
}

function isNamedImportDeclaration(
  value: NodePath,
  callee: NodePath<CallExpression['callee']>,
  name: string,
): boolean {
  if (!value.isImportDeclaration() || !callee.isIdentifier()) {
    return false;
  }

  return value.get('specifiers').some(specifier => {
    if (!specifier.isImportSpecifier()) {
      return false;
    }
    const imported = specifier.get('imported');
    const local = specifier.get('local');

    return (
      (imported.isIdentifier({ name }) ||
        imported.isStringLiteral({ value: name })) &&
      local.node.name === callee.node.name
    );
  });
}

/**
 * Returns true if the expression is a function call of the form
 * `React.foo(...)`.
 */
export default function isReactBuiltinCall(
  path: NodePath,
  name: string,
): boolean {
  if (path.isExpressionStatement()) {
    path = path.get('expression');
  }

  if (path.isCallExpression()) {
    const callee = path.get('callee');

    if (
      callee.isMemberExpression() &&
      callee.get('property').isIdentifier({ name })
    ) {
      const module = resolveToModule(callee.get('object'));

      return Boolean(module && isReactModuleName(module));
    }

    const value = resolveToValue(callee);

    if (value === callee) {
      return false;
    }

    if (
      // const { x } = require('react')
      isDestructuringAssignment(value, name) ||
      // `require('react').createElement`
      isNamedMemberExpression(value, name) ||
      // `import { createElement } from 'react'`
      isNamedImportDeclaration(value, callee, name)
    ) {
      const module = resolveToModule(value);

      return Boolean(module && isReactModuleName(module));
    }
  }

  return false;
}
