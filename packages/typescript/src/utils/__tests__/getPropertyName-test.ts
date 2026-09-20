import { expect, test } from 'vitest';
import {
  getPropertyName,
  isObjectExpression,
  isProperty,
  isVariableDeclaration,
  isVariableDeclarator,
} from '@react-docgen/core';
import parseFile from '../../__tests__/testUtils.js';

test('reads identifier and literal property names', () => {
  const file = parseFile('const value = { plain: 1, ["text"]: 2, [2]: 3 };');
  const declaration = file.ast.body[0];
  const variable =
    declaration && isVariableDeclaration(declaration)
      ? declaration.declarations[0]
      : null;
  const object =
    variable && isVariableDeclarator(variable) && variable.init
      ? variable.init
      : null;
  const properties =
    object && isObjectExpression(object) ? object.properties : [];

  expect(
    properties.map((property) =>
      isProperty(property) ? getPropertyName(property.key) : null,
    ),
  ).toEqual(['plain', 'text', '2']);
});
