import { parse, makeMockImporter, parseTypescript } from '../../../tests/utils';
import DocumentationBuilder from '../../Documentation';
import codeTypeHandler from '../codeTypeHandler.js';
import type DocumentationMock from '../../__mocks__/Documentation';
import type {
  VariableDeclaration,
  ArrowFunctionExpression,
  CallExpression,
  ClassDeclaration,
  ExportNamedDeclaration,
  ObjectExpression,
} from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { ComponentNode } from '../../resolver';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../Documentation.js');

describe('codeTypeHandler', () => {
  let documentation: DocumentationBuilder & DocumentationMock;

  beforeEach(() => {
    documentation = new DocumentationBuilder() as DocumentationBuilder &
      DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    something: (stmtLast) =>
      stmtLast<ExportNamedDeclaration>(`
      export type Props = {
        foo: string,
        bar?: number,
        hal: boolean,
        [key: string]: string,
        abc: string | number,
        def: "test" | 1 | true,
        foobar: Foo & Bar,
      };
    `).get('declaration') as NodePath,
  });

  function template(src: string, typeObject: string): string {
    return `
      ${src}
      var React = require('React');
      var Component = React.Component;

      type Props = ${typeObject};
    `;
  }

  function testCodeTypeHandler(
    getSrc: (src: string) => NodePath<ComponentNode>,
  ) {
    test('detects types correctly', () => {
      const flowTypesSrc = `
      {
        foo: string,
        bar: number,
        hal: boolean,
      }
      `;
      const definition = getSrc(flowTypesSrc);

      codeTypeHandler(documentation, definition);

      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('detects whether a prop is required', () => {
      const flowTypesSrc = `
      {
        foo: string,
        bar?: number,
      }
      `;
      const definition = getSrc(flowTypesSrc);

      codeTypeHandler(documentation, definition);

      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('ignores hash map entry', () => {
      const flowTypesSrc = `
      {
        [key: string]: string,
        bar?: number,
      }
      `;
      const definition = getSrc(flowTypesSrc);

      codeTypeHandler(documentation, definition);

      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('detects union types', () => {
      const flowTypesSrc = `
      {
        foo: string | number,
        bar: "test" | 1 | true,
      }
      `;
      const definition = getSrc(flowTypesSrc);

      codeTypeHandler(documentation, definition);

      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('detects intersection types', () => {
      const flowTypesSrc = `
      {
        foo: Foo & Bar,
      }
      `;
      const definition = getSrc(flowTypesSrc);

      codeTypeHandler(documentation, definition);

      expect(documentation.descriptors).toMatchSnapshot();
    });

    describe('special generic type annotations', () => {
      ['$ReadOnly', '$Exact'].forEach((annotation) => {
        test(`unwraps ${annotation}<...>`, () => {
          const flowTypesSrc = `
            ${annotation}<{
              foo: string | number,
            }>
          `;

          const definition = getSrc(flowTypesSrc);

          codeTypeHandler(documentation, definition);

          expect(documentation.descriptors).toMatchSnapshot();
        });
      });
    });
  }

  describe('class definition for flow <0.53', () => {
    testCodeTypeHandler((propTypesSrc) =>
      parse.statement(
        template(
          'class Foo extends Component<void, Props, void> {}',
          propTypesSrc,
        ),
      ),
    );
  });

  describe('stateless TS component with Type', () => {
    testCodeTypeHandler(
      (propTypesSrc) =>
        parseTypescript
          .statement(
            template(
              'const MyComponent:React.FC<Props> = (props) => null;',
              propTypesSrc,
            ),
          )
          .get('declarations')[0]
          .get('init') as NodePath<ArrowFunctionExpression>,
    );
  });

  describe.each([
    ['flow', parse],
    ['ts', parseTypescript],
  ])('TypeAlias (%s)', (name, parseFunc) => {
    describe('class definition without State', () => {
      testCodeTypeHandler((propTypesSrc) =>
        parseFunc.statement(
          template('class Foo extends Component<Props> {}', propTypesSrc),
        ),
      );
    });

    describe('class definition with State', () => {
      testCodeTypeHandler((propTypesSrc) =>
        parseFunc.statement(
          template(
            'class Foo extends Component<Props, State> {}',
            propTypesSrc,
          ),
        ),
      );
    });

    describe('class definition with inline props', () => {
      testCodeTypeHandler((propTypesSrc) =>
        parseFunc.statement(
          template(
            'class Foo extends Component { props: Props; }',
            propTypesSrc,
          ),
        ),
      );
    });

    describe('stateless component', () => {
      testCodeTypeHandler(
        (propTypesSrc) =>
          parseFunc
            .statement(template('(props: Props) => null;', propTypesSrc))
            .get('expression') as NodePath<ArrowFunctionExpression>,
      );
    });
  });

  describe('does not error if flowTypes cannot be found', () => {
    test('ObjectExpression', () => {
      const definition = parse.expression<ObjectExpression>('{fooBar: 42}');

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
    });

    test('ClassDeclaration', () => {
      const definition = parse.statement<ClassDeclaration>(
        'class Foo extends Component {}',
      );

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
    });

    test('ArrowFunctionExpression', () => {
      const definition =
        parse.statement<ArrowFunctionExpression>('() => <div />');

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
    });
  });

  test('supports intersection proptypes', () => {
    const definition = parse
      .statement(
        `(props: Props) => <div />;
         var React = require('React');
         import type Imported from 'something';
         type Props = Imported & { foo: 'bar' };`,
      )
      .get('expression') as NodePath<ArrowFunctionExpression>;

    codeTypeHandler(documentation, definition);

    expect(documentation.descriptors).toMatchSnapshot();
  });

  test('handles circular interface inheritance', () => {
    const definition = parseTypescript
      .statement(
        `(props: A) => null;
         interface A extends B { a: number }
         interface B extends A { b: number }`,
      )
      .get('expression') as NodePath<ArrowFunctionExpression>;

    codeTypeHandler(documentation, definition);

    expect(Object.keys(documentation.descriptors)).toEqual(['b', 'a']);
  });

  test('does support utility types inline', () => {
    const definition = parse
      .statement(
        `(props: $ReadOnly<Props>) => <div />;
         var React = require('React');
         type Props = { foo: 'fooValue' };`,
      )
      .get('expression') as NodePath<ArrowFunctionExpression>;

    expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
    expect(documentation.descriptors).toMatchSnapshot();
  });

  test('does not support union proptypes', () => {
    const definition = parse
      .statement(
        `(props: Props) => <div />;
         var React = require('React');
         import type Imported from 'something';
         type Other = { bar: 'barValue' };
         type Props = Imported | Other | { foo: 'fooValue' };`,
      )
      .get('expression') as NodePath<ArrowFunctionExpression>;

    expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
    expect(documentation.descriptors).toEqual({});
  });

  describe('imported prop types', () => {
    test('does not resolve type included by require', () => {
      const definition = parse
        .statement(
          `(props: Props) => <div />;
           var React = require('React');
           var Component = React.Component;
           var Props = require('something');`,
          mockImporter,
        )
        .get('expression') as NodePath<ArrowFunctionExpression>;

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
      expect(documentation.descriptors).toEqual({});
    });

    test('imported', () => {
      const definition = parse
        .statement(
          `(props: Props) => <div />;
           var React = require('React');
           var Component = React.Component;
           import { Props } from 'something';`,
          mockImporter,
        )
        .get('expression') as NodePath<ArrowFunctionExpression>;

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('type not imported', () => {
      const definition = parse
        .statement(
          `(props: Props) => <div />;
           var React = require('React');
           var Component = React.Component;
           import type { Props } from 'something';`,
        )
        .get('expression') as NodePath<ArrowFunctionExpression>;

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
      expect(documentation.descriptors).toEqual({});
    });

    test('type imported', () => {
      const definition = parse
        .statement(
          `(props: Props) => <div />;
           var React = require('React');
           var Component = React.Component;
           import type { Props } from 'something';`,
          mockImporter,
        )
        .get('expression') as NodePath<ArrowFunctionExpression>;

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('does not resolve types not in scope', () => {
      const definition = parse
        .statement(
          `(props: Props) => <div />;
           var React = require('React');
           var Component = React.Component;`,
          mockImporter,
        )
        .get('expression') as NodePath<ArrowFunctionExpression>;

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
      expect(documentation.descriptors).toEqual({});
    });

    test('does not resolve types not in scope', () => {
      const definition = parse
        .statement(
          `(props: Props) => <div />;
           var React = require('React');
           var Component = React.Component;`,
          mockImporter,
        )
        .get('expression') as NodePath<ArrowFunctionExpression>;

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
      expect(documentation.descriptors).toEqual({});
    });
  });

  describe('forwardRef', () => {
    test('resolves prop type from function expression', () => {
      const src = `
        import React from 'react';
        type Props = { foo: string };
        React.forwardRef((props: Props, ref) => <div ref={ref}>{props.foo}</div>);
      `;

      codeTypeHandler(documentation, parse.expressionLast<CallExpression>(src));
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves when the function is not inline', () => {
      const src = `
        import React from 'react';
        type Props = { foo: string };
        const ComponentImpl = (props: Props, ref) => <div ref={ref}>{props.foo}</div>;
        React.forwardRef(ComponentImpl);
      `;

      codeTypeHandler(documentation, parse.expressionLast<CallExpression>(src));
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves when the function is rebound and not inline', () => {
      const src = `
        import React from 'react';
        type Props = { foo: string };
        let Component = (props: Props, ref) => <div ref={ref}>{props.foo}</div>;
        Component = React.forwardRef(Component);
      `;

      codeTypeHandler(
        documentation,
        parse.expressionLast(src).get('right') as NodePath<CallExpression>,
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });

  test('stateless TS component with 2 definitions', () => {
    const definition = parseTypescript
      .statement<VariableDeclaration>(
        `
      const MyComponent: React.FC<{ additional: boolean }> = (props: Props) => null;
      var React = require('React');
      var Component = React.Component;

      type Props = { bar: number };
    `,
      )
      .get('declarations')[0]
      .get('init') as NodePath<ArrowFunctionExpression>;

    codeTypeHandler(documentation, definition);

    expect(documentation.descriptors).toMatchSnapshot();
  });

  test('stateless TS component and variable type takes precedence', () => {
    const definition = parseTypescript
      .statement<VariableDeclaration>(
        `
      const MyComponent: React.FC<{ foo: string }> = (props: Props) => null;
      var React = require('React');
      var Component = React.Component;

      type Props = { foo: number };
    `,
      )
      .get('declarations')[0]
      .get('init') as NodePath<ArrowFunctionExpression>;

    codeTypeHandler(documentation, definition);

    expect(documentation.descriptors).toMatchSnapshot();
  });

  describe('function type of the component variable', () => {
    function getProps(src: string) {
      const definition = parseTypescript
        .statement<VariableDeclaration>(src)
        .get('declarations')[0]
        .get('init') as NodePath<ArrowFunctionExpression>;

      codeTypeHandler(documentation, definition);

      return documentation.descriptors;
    }

    test('reads props from a type alias of a function type', () => {
      expect(
        getProps(`
          const MyComponent: FnType = (props) => null;
          type FnType = (props: Props) => null;
          type Props = {
            /** The foo prop */
            foo: string;
          };
        `),
      ).toEqual({
        foo: {
          required: true,
          tsType: { name: 'string' },
          description: 'The foo prop',
        },
      });
    });

    test('reads props from an interface with a call signature', () => {
      expect(
        Object.keys(
          getProps(`
            const MyComponent: Fn = (props) => null;
            interface Fn {
              (props: Props): null;
              displayName?: string;
            }
            type Props = { foo: string };
          `),
        ),
      ).toEqual(['foo']);
    });

    test('reads props from a type literal with a call signature', () => {
      expect(
        Object.keys(
          getProps(`
            const MyComponent: Fn = (props) => null;
            type Fn = { (props: Props): null };
            type Props = { foo: string };
          `),
        ),
      ).toEqual(['foo']);
    });

    test('reads props from an inline function type', () => {
      expect(
        Object.keys(
          getProps(`
            const MyComponent: (props: Props) => null = (props) => null;
            type Props = { foo: string };
          `),
        ),
      ).toEqual(['foo']);
    });

    test('reads props from a generic type alias of a function type', () => {
      expect(
        Object.keys(
          getProps(`
            const MyComponent: Component<Props> = (props) => null;
            type Component<P> = (props: P) => null;
            type Props = { foo: string };
          `),
        ),
      ).toEqual(['foo']);
    });

    test('reads props from a generic interface with a call signature', () => {
      expect(
        Object.keys(
          getProps(`
            const MyComponent: Component<Props> = (props) => null;
            interface Component<P> { (props: P): null }
            interface Props { foo: string }
          `),
        ),
      ).toEqual(['foo']);
    });

    test('ignores a type that is not a function type', () => {
      expect(
        getProps(`
          const MyComponent: Fn = (props) => null;
          type Fn = string;
        `),
      ).toEqual({});
    });
  });
});
