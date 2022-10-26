import { parse, makeMockImporter } from '../../../tests/utils';
import componentMethodsHandler from '../componentMethodsHandler';
import Documentation from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import type {
  ArrowFunctionExpression,
  AssignmentExpression,
  ClassDeclaration,
  ExportDefaultDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  VariableDeclaration,
} from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { ComponentNode } from '../../resolver';

jest.mock('../../Documentation');

describe('componentMethodsHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    baz: stmtLast =>
      stmtLast<ExportDefaultDeclaration>(`
      export default (foo: string): string => {};
    `).get('declaration'),

    foo: stmtLast =>
      stmtLast<ExportDefaultDeclaration>(`
      export default function(bar: number): number {
        return bar;
      }
    `).get('declaration'),

    doFoo: stmtLast =>
      stmtLast<ExportDefaultDeclaration>(`
      export default () => {};
    `).get('declaration'),
  });

  function test(definition) {
    componentMethodsHandler(documentation, definition);
    expect(documentation.methods).toEqual([
      {
        name: 'foo',
        docblock: 'The foo method',
        modifiers: [],
        returns: {
          type: { name: 'number' },
        },
        params: [
          {
            name: 'bar',
            optional: false,
            type: { name: 'number' },
          },
        ],
      },
      {
        name: 'baz',
        docblock: '"arrow function method"',
        modifiers: [],
        returns: {
          type: { name: 'string' },
        },
        params: [
          {
            name: 'foo',
            optional: false,
            type: { name: 'string' },
          },
        ],
      },
      {
        name: 'bar',
        docblock: 'Static function',
        modifiers: ['static'],
        returns: null,
        params: [],
      },
    ]);
  }

  describe('useImperativeHandle', () => {
    // Other cases BlockScopeBody with return, both assigned and useImperativeHandles

    const methodDefinitions = {
      'direct ObjectExpression': '({ method: () => {} })',
      'regular ReturnStatement': '{x; return { method: () => {} };}',
      'assigned ReturnStatement': '{const r = { method: () => {} }; return r;}',
    };

    Object.entries(methodDefinitions).forEach(([name, code]) => {
      describe(name, () => {
        it('FunctionExpression Component', () => {
          const definition = parse.expressionLast<FunctionExpression>(
            `import { useImperativeHandle } from 'react';
         (function () {
           useImperativeHandle(ref, () => ${code});
           return <div />;
         });`,
          );

          componentMethodsHandler(documentation, definition);

          expect(documentation.methods).toHaveLength(1);
          expect(documentation.methods).toMatchSnapshot();
        });

        it('FunctionDeclaration Component', () => {
          const definition = parse.statementLast<FunctionDeclaration>(
            `import { useImperativeHandle } from 'react';
         function Component() {
           useImperativeHandle(ref, () => ${code});
           return <div />;
         }`,
          );

          componentMethodsHandler(documentation, definition);

          expect(documentation.methods).toHaveLength(1);
          expect(documentation.methods).toMatchSnapshot();
        });

        it('ArrowFunctionExpression Component', () => {
          const definition = parse.expressionLast<FunctionExpression>(
            `import { useImperativeHandle } from 'react';
         (() => {
           useImperativeHandle(ref, () => ${code});
           return <div />;
         });`,
          );

          componentMethodsHandler(documentation, definition);

          expect(documentation.methods).toHaveLength(1);
          expect(documentation.methods).toMatchSnapshot();
        });
      });
    });

    it('AssignmentExpression and useImperativeHandle', () => {
      const definition = parse
        .statement<AssignmentExpression>(
          `import { useImperativeHandle } from 'react';
            let Component;
            Component = function () {
              test();
              useImperativeHandle(ref, () => ({ method: () => {} }));

              return <div />;
            };
            Component.other = () => {};
          `,
          -2,
        )
        .get('expression.right') as NodePath<ComponentNode>;

      componentMethodsHandler(documentation, definition);

      expect(documentation.methods).toMatchSnapshot();
    });

    it('VariableDeclaration and useImperativeHandle', () => {
      const definition = parse
        .statement<VariableDeclaration>(
          `import { useImperativeHandle } from 'react';
            let Component = function () {
              test();
              useImperativeHandle(ref, () => ({ method: () => {} }));

              return <div />;
            };
            Component.other = () => {};
          `,
          -2,
        )
        .get('declarations.0.init') as NodePath<ComponentNode>;

      componentMethodsHandler(documentation, definition);

      expect(documentation.methods).toMatchSnapshot();
    });
  });

  it('extracts the documentation for an ObjectExpression', () => {
    const src = `
      {
        /**
         * The foo method
         */
        foo(bar: number): number {
          return bar;
        },
        /**
         * "arrow function method"
         */
        baz: (foo: string): string => {},
        statics: {
          /**
           * Static function
           */
          bar() {}
        },
        state: {
          foo: 'foo',
        },
        componentDidMount() {},
        render() {
          return null;
        },
      }
    `;

    test(parse.expression(src));
  });

  it('can resolve an imported method on an ObjectExpression', () => {
    const src = `
      import baz from 'baz';
      ({
        /**
         * The foo method
         */
        foo(bar: number): number {
          return bar;
        },
        /**
         * "arrow function method"
         */
        baz: baz,
        statics: {
          /**
           * Static function
           */
          bar() {}
        },
        state: {
          foo: 'foo',
        },
        componentDidMount() {},
        render() {
          return null;
        },
      })
    `;

    test(parse.expressionLast(src, mockImporter));
  });

  it('extracts the documentation for a ClassDeclaration', () => {
    const src = `
      class Test extends React.Component {
        /**
         * The foo method
         */
        foo(bar: number): number {
          return bar;
        }

        /**
         * "arrow function method"
         */
        baz = (foo: string): string => {};

        /**
         * Static function
         */
        static bar() {}

        state = {
          foo: 'foo',
        };

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    test(parse.statement<ClassDeclaration>(src));
  });

  it('can resolve an imported method on a ClassDeclaration', () => {
    const src = `
      import baz from 'baz';
      class Test extends React.Component {
        /**
         * The foo method
         */
        foo(bar: number): number {
          return bar;
        }

        /**
         * "arrow function method"
         */
        baz = baz;

        /**
         * Static function
         */
        static bar() {}

        state = {
          foo: 'foo',
        };

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    test(parse.statementLast(src, mockImporter));
  });

  it('should handle and ignore computed methods', () => {
    const src = `
      class Test extends React.Component {
        /**
         * The foo method
         */
        [foo](bar: number): number {
          return bar;
        }

        /**
         * Should not show up
         */
        [() => {}](bar: number): number {
          return bar;
        }

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    componentMethodsHandler(
      documentation,
      parse.statement<ClassDeclaration>(src),
    );
    expect(documentation.methods).toMatchSnapshot();
  });

  it('resolves imported methods assigned to computed properties', () => {
    const src = `
      import foo from 'foo';
      class Test extends React.Component {
        /**
         * The foo method
         */
        [foo] = foo;

        /**
         * Should not show up
         */
        [() => {}](bar: number): number {
          return bar;
        }

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    componentMethodsHandler(
      documentation,
      parse.statementLast<ClassDeclaration>(src, mockImporter),
    );
    expect(documentation.methods).toMatchSnapshot();
  });

  it('should handle and ignore private properties', () => {
    const src = `
      class Test extends React.Component {
        #privateProperty = () => {
          console.log('Do something');
        }

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    componentMethodsHandler(
      documentation,
      parse.statement<ClassDeclaration>(src),
    );
    expect((documentation.methods as unknown[]).length).toBe(0);
  });

  describe('function components', () => {
    it('no methods', () => {
      const src = `
        (props) => {}
      `;

      const definition = parse
        .statement(src)
        .get('expression') as NodePath<ArrowFunctionExpression>;

      componentMethodsHandler(documentation, definition);
      expect(documentation.methods).toEqual([]);
    });

    it('finds static methods on a component in a variable declaration', () => {
      const src = `
        const Test = (props) => {};
        Test.doFoo = () => {};
        Test.doBar = () => {};
        Test.displayName = 'Test'; // Not a method
      `;

      componentMethodsHandler(
        documentation,
        parse
          .statement(src)
          .get('declarations.0.init') as NodePath<ArrowFunctionExpression>,
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('resolves imported methods assigned to static properties on a component', () => {
      const src = `
        const Test = (props) => {};
        import doFoo from 'doFoo';
        Test.doFoo = doFoo;
      `;

      componentMethodsHandler(
        documentation,
        parse
          .statement(src, mockImporter)
          .get('declarations.0.init') as NodePath<ArrowFunctionExpression>,
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('finds static methods on a component in an assignment', () => {
      const src = `
        let Test;
        Test = (props) => {};
        Test.doFoo = () => {};
        Test.doBar = () => {};
        Test.displayName = 'Test'; // Not a method
      `;

      componentMethodsHandler(
        documentation,
        parse
          .statement(src, 1)
          .get('expression.right') as NodePath<ArrowFunctionExpression>,
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('resolves imported methods assigned on a component in an assignment', () => {
      const src = `
        let Test;
        Test = (props) => {};
        import doFoo from 'doFoo';
        Test.doFoo = doFoo;
      `;

      componentMethodsHandler(
        documentation,
        parse
          .statement(src, mockImporter, 1)
          .get('expression.right') as NodePath<ArrowFunctionExpression>,
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('finds static methods on a function declaration', () => {
      const src = `
        function Test(props) {}
        Test.doFoo = () => {};
        Test.doBar = () => {};
        Test.displayName = 'Test'; // Not a method
      `;

      componentMethodsHandler(
        documentation,
        parse.statement<FunctionDeclaration>(src),
      );
      expect(documentation.methods).toMatchSnapshot();
    });

    it('resolves imported methods on a function declaration', () => {
      const src = `
        function Test(props) {}
        import doFoo from 'doFoo';
        Test.doFoo = doFoo;
      `;

      componentMethodsHandler(
        documentation,
        parse.statement<FunctionDeclaration>(src, mockImporter),
      );
      expect(documentation.methods).toMatchSnapshot();
    });
  });
});
