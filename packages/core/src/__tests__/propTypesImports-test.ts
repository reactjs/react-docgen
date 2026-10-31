import { expect, test } from 'vitest';
import { createDocgen, propTypesHandler, type AstNode } from '../index.js';

const id = (name: string): AstNode => ({ type: 'Identifier', name });
const literal = (value: string): AstNode => ({ type: 'Literal', value });
const imported = (source: string, named = false): AstNode => ({
  type: 'ImportDeclaration',
  source: literal(source),
  specifiers: [
    {
      type: named ? 'ImportSpecifier' : 'ImportDefaultSpecifier',
      local: id('PropTypes'),
      ...(named ? { imported: id('PropTypes') } : {}),
    },
  ],
});

function propType(imports: AstNode[], prefix = '') {
  const raw = 'PropTypes.string';
  const code = `${prefix}\n${raw}`;
  const component: AstNode = {
    type: 'FunctionDeclaration',
    id: id('Button'),
    params: [],
  };
  const ast: AstNode = {
    type: 'Program',
    body: [
      ...imports,
      component,
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: '=',
          left: {
            type: 'MemberExpression',
            computed: false,
            object: id('Button'),
            property: id('propTypes'),
          },
          right: {
            type: 'ObjectExpression',
            properties: [
              {
                type: 'Property',
                key: id('value'),
                value: {
                  type: 'MemberExpression',
                  computed: false,
                  object: id('PropTypes'),
                  property: id('string'),
                  range: [code.length - raw.length, code.length],
                },
              },
            ],
          },
        },
      },
    ],
  };
  const parse = createDocgen({
    parser: {
      parse: () => ast,
      visitorKeys: {
        Program: ['body'],
        ImportDeclaration: ['specifiers', 'source'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        CallExpression: ['callee', 'arguments'],
      },
    },
    resolver(file) {
      const body = file.path.get('body');

      return Array.isArray(body)
        ? body.filter((path) => path.node === component)
        : [];
    },
    handlers: [propTypesHandler],
  });

  return parse(code, { filename: 'button.js' })[0]?.props?.value?.type;
}

test('recognizes a package import with long whitespace from its AST', () => {
  expect(
    propType(
      [imported('prop-types')],
      `import ${' '.repeat(20_000)}PropTypes from 'prop-types';`,
    ),
  ).toEqual({ name: 'string' });
});

test('recognizes named React PropTypes imports', () => {
  expect(
    propType([imported('react', true)], "import { PropTypes } from 'react';"),
  ).toEqual({ name: 'string' });
});

test('recognizes require calls with whitespace and comments', () => {
  const declaration: AstNode = {
    type: 'VariableDeclaration',
    declarations: [
      {
        type: 'VariableDeclarator',
        id: id('PropTypes'),
        init: {
          type: 'CallExpression',
          callee: id('require'),
          arguments: [literal('prop-types')],
        },
      },
    ],
  };

  expect(
    propType(
      [declaration],
      "const PropTypes = require( /* package */ 'prop-types' );",
    ),
  ).toEqual({ name: 'string' });
});

test.each([
  { name: 'a comment', source: "// import { PropTypes } from 'react';" },
  {
    name: 'a string literal',
    source: `const example = "require('prop-types')";`,
  },
  {
    name: 'a long unrelated import',
    source: `import ${' '.repeat(20_000)}PropTypes from 'custom-validators';`,
  },
])('does not infer imports from $name', ({ source }) => {
  expect(propType([imported('custom-validators')], source)).toEqual({
    name: 'custom',
    raw: 'PropTypes.string',
  });
});
