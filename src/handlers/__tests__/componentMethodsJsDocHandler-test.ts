import type { NodePath } from '@babel/traverse';
import Documentation from '../../Documentation';
import type { ComponentNode } from '../../resolver';
import type DocumentationMock from '../../__mocks__/Documentation';
import componentMethodsJsDocHandler from '../componentMethodsJsDocHandler';

describe('componentMethodsJsDocHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  it('stays the same when no docblock is present', () => {
    const methods = [
      {
        name: 'foo',
        docblock: null,
        modifiers: [],
        returns: null,
        params: [
          {
            name: 'test',
            type: null,
          },
        ],
      },
    ];

    documentation.set('methods', methods);
    componentMethodsJsDocHandler(documentation, {} as NodePath<ComponentNode>);
    expect(documentation.get('methods')).toEqual(methods);
  });

  it('adds js doc types when no flow types', () => {
    documentation.set('methods', [
      {
        name: 'foo',
        docblock: `
        @param {string} test
        @returns {string}
      `,
        modifiers: [],
        returns: null,
        params: [
          {
            name: 'test',
            type: null,
          },
        ],
      },
    ]);
    componentMethodsJsDocHandler(documentation, {} as NodePath<ComponentNode>);
    expect(documentation.get('methods')).toMatchSnapshot();
  });

  it('keeps flow types over js doc types', () => {
    documentation.set('methods', [
      {
        name: 'foo',
        docblock: `
        @param {string} test
        @returns {string}
      `,
        modifiers: [],
        returns: {
          type: { name: 'number' },
        },
        params: [
          {
            name: 'test',
            type: { name: 'number' },
          },
        ],
      },
    ]);
    componentMethodsJsDocHandler(documentation, {} as NodePath<ComponentNode>);
    expect(documentation.get('methods')).toMatchSnapshot();
  });

  it('adds descriptions', () => {
    documentation.set('methods', [
      {
        name: 'foo',
        docblock: `
        The foo method.
        @param test The test
        @returns The number
      `,
        modifiers: [],
        returns: null,
        params: [
          {
            name: 'test',
            type: null,
          },
        ],
      },
    ]);
    componentMethodsJsDocHandler(documentation, {} as NodePath<ComponentNode>);
    expect(documentation.get('methods')).toMatchSnapshot();
  });
});
