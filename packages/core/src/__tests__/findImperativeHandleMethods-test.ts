import { expect, test } from 'vitest';
import { ProjectContext, type AstNode } from '../index.js';
import findImperativeHandleMethods from '../utils/findImperativeHandleMethods.js';

const id = (name: string): AstNode => ({ type: 'Identifier', name });
const fn = (): AstNode => ({
  type: 'ArrowFunctionExpression',
  params: [],
  body: { type: 'BlockStatement', body: [] },
});
const variable = (name: string, init: AstNode): AstNode => ({
  type: 'VariableDeclaration',
  declarations: [{ type: 'VariableDeclarator', id: id(name), init }],
});
const call = (name: string, args: AstNode[]): AstNode => ({
  type: 'CallExpression',
  callee: id(name),
  arguments: args,
});

function findMethods({
  declarations = [],
  params = [],
  source = 'react',
  value = call('useCb', [fn()]),
  factories,
}: {
  declarations?: AstNode[];
  params?: AstNode[];
  source?: string;
  value?: AstNode;
  factories?: AstNode[];
} = {}) {
  const property = { type: 'Property', key: id('focus'), value: id('method') };
  const ast: AstNode = {
    type: 'Program',
    body: [
      {
        type: 'ImportDeclaration',
        source: { type: 'Literal', value: source },
        specifiers: ['useCallback', 'useImperativeHandle'].map(
          (name, index) => ({
            type: 'ImportSpecifier',
            imported: id(name),
            local: id(index === 0 ? 'useCb' : name),
          }),
        ),
      },
      {
        type: 'FunctionDeclaration',
        id: id('Input'),
        params,
        body: {
          type: 'BlockStatement',
          body: [
            ...declarations,
            variable('method', value),
            ...(
              factories ?? [
                {
                  type: 'ArrowFunctionExpression',
                  params: [],
                  body: { type: 'ObjectExpression', properties: [property] },
                },
              ]
            ).map((factory) => ({
              type: 'ExpressionStatement',
              expression: call('useImperativeHandle', [id('ref'), factory]),
            })),
          ],
        },
      },
    ],
  };
  const project = new ProjectContext({
    importer() {
      throw new Error('Unexpected import');
    },
    selectParser: () => ({
      parse: () => ast,
      visitorKeys: {
        BlockStatement: ['body'],
        ExpressionStatement: ['expression'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
      },
    }),
  });
  const file = project.parse({ code: '', filename: 'input.js' });
  const body = file.path.get('body');
  const component = Array.isArray(body) ? body[1] : null;

  if (!component) throw new Error('Missing component');

  return findImperativeHandleMethods(file, component);
}

test('resolves React aliases and component-local callback identifiers', () => {
  const callback = fn();
  const methods = findMethods({
    declarations: [variable('callback', callback)],
    value: call('useCb', [id('callback')]),
  });

  expect(methods).toHaveLength(1);
  expect(methods[0]?.fn).toBe(callback);
});

test('does not mistake a component parameter for an imported React hook', () => {
  expect(findMethods({ params: [id('useCb')] })).toEqual([]);
});

test('does not unwrap hooks imported from another package', () => {
  expect(findMethods({ source: 'other-library' })).toEqual([]);
});

test('stops resolving circular callback aliases', () => {
  expect(
    findMethods({
      declarations: [
        variable('first', id('second')),
        variable('second', id('first')),
      ],
      value: call('useCb', [id('first')]),
    }),
  ).toEqual([]);
});

test('keeps visitor state separate across factories and extractions', () => {
  const first = fn();
  const second = fn();
  const factories: AstNode[] = [first, second].map((callback) => ({
    type: 'ArrowFunctionExpression',
    params: [],
    body: {
      type: 'BlockStatement',
      body: [
        variable('handle', {
          type: 'ObjectExpression',
          properties: [
            {
              type: 'Property',
              key: id('focus'),
              value: call('useCb', [callback]),
            },
          ],
        }),
        { type: 'ReturnStatement', argument: id('handle') },
      ],
    },
  }));

  expect(findMethods({ factories }).map((method) => method.fn)).toEqual([
    first,
    second,
  ]);
  expect(findMethods({ source: 'other-library' })).toEqual([]);
  expect(findMethods()).toHaveLength(1);
});
