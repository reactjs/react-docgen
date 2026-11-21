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

  describe('Pick and Omit', () => {
    function getPropNames(code: string): string[] {
      const definition = parseTypescript
        .statement(code)
        .get('expression') as NodePath<ArrowFunctionExpression>;

      codeTypeHandler(documentation, definition);

      return Object.keys(documentation.descriptors);
    }

    test('picks props', () => {
      expect(
        getPropNames(
          `(props: Pick<Props, 'a' | 'b'>) => null;
           interface Props { a: string; b: number; c: boolean }`,
        ),
      ).toEqual(['a', 'b']);
    });

    test('omits props', () => {
      expect(
        getPropNames(
          `(props: Omit<Props, 'b'>) => null;
           interface Props { a: string; b: number; c: boolean }`,
        ),
      ).toEqual(['a', 'c']);
    });

    test('reads the docs of picked props', () => {
      getPropNames(
        `(props: Pick<Props, 'a'>) => null;
         interface Props {
           /** The a prop */
           a?: string;
           b: number;
         }`,
      );

      expect(documentation.descriptors).toEqual({
        a: {
          required: false,
          tsType: { name: 'string' },
          description: 'The a prop',
        },
      });
    });

    test('supports Pick and Omit in type aliases and intersections', () => {
      expect(
        getPropNames(
          `(props: Props) => null;
           interface Base { a: string; b: number; c: boolean }
           type Props = Omit<Base, 'c'> & { d: string };`,
        ),
      ).toEqual(['a', 'b', 'd']);
    });

    test('supports Pick and Omit in interface extends', () => {
      expect(
        getPropNames(
          `(props: Props) => null;
           interface Base { a: string; b: number }
           interface Props extends Pick<Base, 'a'> { c: boolean }`,
        ),
      ).toEqual(['a', 'c']);
      expect(documentation.composes).toEqual([]);
    });

    test('supports nested Pick and Omit', () => {
      expect(
        getPropNames(
          `(props: Omit<Pick<Base, 'a' | 'b'>, 'b'>) => null;
           interface Base { a: string; b: number; c: boolean }`,
        ),
      ).toEqual(['a']);
    });

    test('reads a type again when it is used twice', () => {
      expect(
        getPropNames(
          `(props: Pick<Base, 'a'> & Omit<Base, 'a'>) => null;
           interface Base { a: string; b: number }`,
        ),
      ).toEqual(['a', 'b']);
    });

    test('handles a Pick of the type that extends it', () => {
      expect(
        getPropNames(
          `(props: A) => null;
           interface A extends Pick<A, 'a'> { a: string; b: number }`,
        ),
      ).toEqual(['a', 'b']);
    });

    test('binds type arguments of the picked type', () => {
      getPropNames(
        `(props: Props) => null;
         interface Base<T> { value: T; other: number }
         interface Props extends Pick<Base<string>, 'value'> {}`,
      );

      expect(documentation.descriptors).toEqual({
        value: { required: true, tsType: { name: 'string' }, description: '' },
      });
    });

    test('supports number keys', () => {
      expect(
        getPropNames(
          `(props: Omit<Props, 0>) => null;
           interface Props { 0: string; a: number }`,
        ),
      ).toEqual(['a']);
    });

    test('ignores locally declared Pick types', () => {
      expect(
        getPropNames(
          `(props: Pick<Base, 'a'>) => null;
           type Pick<T, K> = { local: string };
           interface Base { a: string }`,
        ),
      ).toEqual(['local']);
    });

    test('adds composes for an unresolved source in extends', () => {
      expect(
        getPropNames(
          `(props: Props) => null;
           import type { LinkProps } from 'next/link';
           interface Props extends Pick<LinkProps, 'href'> { a: string }`,
        ),
      ).toEqual(['a']);
      expect(documentation.composes).toEqual(['LinkProps']);
    });
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
});
