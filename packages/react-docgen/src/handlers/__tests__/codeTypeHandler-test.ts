import { parse, makeMockImporter } from '../../../tests/utils';
import DocumentationBuilder from '../../Documentation';
import codeTypeHandler from '../codeTypeHandler.js';
import type DocumentationMock from '../../__mocks__/Documentation';
import type {
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
vi.mock('../../utils/getFlowType.js', () => ({
  default: () => ({}),
  __esModule: true,
}));

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

      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
          description: '',
        },
        bar: {
          flowType: {},
          required: true,
          description: '',
        },
        hal: {
          flowType: {},
          required: true,
          description: '',
        },
      });
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

      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
          description: '',
        },
        bar: {
          flowType: {},
          required: false,
          description: '',
        },
      });
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

      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
          description: '',
        },
        bar: {
          flowType: {},
          required: true,
          description: '',
        },
      });
    });

    test('detects intersection types', () => {
      const flowTypesSrc = `
      {
        foo: Foo & Bar,
      }
      `;
      const definition = getSrc(flowTypesSrc);

      codeTypeHandler(documentation, definition);

      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
          description: '',
        },
      });
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

          expect(documentation.descriptors).toEqual({
            foo: {
              flowType: {},
              required: true,
              description: '',
            },
          });
        });
      });
    });
  }

  describe('TypeAlias', () => {
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

    describe('class definition for flow >=0.53 without State', () => {
      testCodeTypeHandler((propTypesSrc) =>
        parse.statement(
          template('class Foo extends Component<Props> {}', propTypesSrc),
        ),
      );
    });

    describe('class definition for flow >=0.53 with State', () => {
      testCodeTypeHandler((propTypesSrc) =>
        parse.statement(
          template(
            'class Foo extends Component<Props, State> {}',
            propTypesSrc,
          ),
        ),
      );
    });

    describe('class definition with inline props', () => {
      testCodeTypeHandler((propTypesSrc) =>
        parse.statement(
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
          parse
            .statement(template('(props: Props) => <div />;', propTypesSrc))
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

    expect(documentation.descriptors).toEqual({
      foo: {
        flowType: {},
        required: true,
        description: '',
      },
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
      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
          description: '',
        },
      });
    });

    test('resolves when the function is not inline', () => {
      const src = `
        import React from 'react';
        type Props = { foo: string };
        const ComponentImpl = (props: Props, ref) => <div ref={ref}>{props.foo}</div>;
        React.forwardRef(ComponentImpl);
      `;

      codeTypeHandler(documentation, parse.expressionLast<CallExpression>(src));
      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
          description: '',
        },
      });
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
      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
          description: '',
        },
      });
    });
  });
});
