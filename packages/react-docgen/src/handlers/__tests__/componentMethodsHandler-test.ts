import { parse, makeMockImporter } from '../../../tests/utils';
import componentMethodsHandler from '../componentMethodsHandler';
import Documentation from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import type {
  ArrowFunctionExpression,
  ClassDeclaration,
  ExportDefaultDeclaration,
  FunctionDeclaration,
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

  describe('useImperativeHandle() methods', () => {
    // We're not worried about doc-blocks here, simply about finding method(s)
    // defined via the useImperativeHandle() hook.
    // To simplify the variations, each one ends up with the following in the
    // parsed body:
    //
    // [0] : the initial definition/declaration
    // [1] : a React.forwardRef wrapper (or nothing)
    // [last]: the react import
    //
    // Note that in the cases where the React.forwardRef is used "inline" with
    // the definition/declaration, there is no [1], and it will be skipped.
    function testImperative(src, paths: Array<string | null> = [null]) {
      const srcWithImport = `
        ${src}
        import React, { useImperativeHandle } from "react";
      `;

      paths.forEach((path, index) => {
        const parsed = parse.statement<VariableDeclaration>(
          srcWithImport,
          index,
        );
        const componentDefinition =
          path != null
            ? (parsed.get(path) as NodePath<ComponentNode>)
            : (parsed as unknown as NodePath<ComponentNode>);

        // // reset the documentation, since we may test more than once!
        documentation = new Documentation() as Documentation & DocumentationMock;
        componentMethodsHandler(documentation, componentDefinition);
        expect(documentation.methods).toEqual([
          {
            docblock: null,
            modifiers: [],
            name: 'doFoo',
            params: [],
            returns: null,
          },
        ]);
      });
    }

    it('finds inside a component in a variable declaration', () => {
      testImperative(
        `
        const Test = (props, ref) => {
          useImperativeHandle(ref, () => ({
            doFoo: ()=>{},
          }));
        };
        React.forwardRef(Test);
      `,
        ['declarations.0.init', null],
      );
    });

    it.only('finds inside a component in an assignment', () => {
      testImperative(
        `
      Test = (props, ref) => {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      };
      `,
        ['expression.right'],
      );
    });

    it('finds inside a function declaration', () => {
      testImperative(
        `
      function Test(props, ref) {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      }
      React.forwardRef(Test);
      `,
        [null, null],
      );
    });

    it('finds inside an inlined React.forwardRef call with arrow function', () => {
      testImperative(
        `
      React.forwardRef((props, ref) => {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      });
      `,
        [null],
      );
    });

    it('finds inside an inlined React.forwardRef call with plain function', () => {
      testImperative(
        `
      React.forwardRef(function(props, ref) {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      });
      `,
        [null],
      );
    });
  });
});
