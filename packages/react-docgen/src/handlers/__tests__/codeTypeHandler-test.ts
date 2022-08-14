import { parse, makeMockImporter } from '../../../tests/utils';
import Documentation from '../../Documentation';
import codeTypeHandler from '../codeTypeHandler';
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

jest.mock('../../Documentation');
jest.mock('../../utils/getFlowType', () => ({
  default: () => ({}),
  __esModule: true,
}));

describe('codeTypeHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    something: stmtLast =>
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

  function test(getSrc: (src: string) => NodePath<ComponentNode>) {
    it('detects types correctly', () => {
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

    it('detects whether a prop is required', () => {
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

    it('ignores hash map entry', () => {
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

    it('detects union types', () => {
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

    it('detects intersection types', () => {
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
      ['$ReadOnly', '$Exact'].forEach(annotation => {
        it(`unwraps ${annotation}<...>`, () => {
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
      test(propTypesSrc =>
        parse.statement(
          template(
            'class Foo extends Component<void, Props, void> {}',
            propTypesSrc,
          ),
        ),
      );
    });

    describe('class definition for flow >=0.53 without State', () => {
      test(propTypesSrc =>
        parse.statement(
          template('class Foo extends Component<Props> {}', propTypesSrc),
        ),
      );
    });

    describe('class definition for flow >=0.53 with State', () => {
      test(propTypesSrc =>
        parse.statement(
          template(
            'class Foo extends Component<Props, State> {}',
            propTypesSrc,
          ),
        ),
      );
    });

    describe('class definition with inline props', () => {
      test(propTypesSrc =>
        parse.statement(
          template(
            'class Foo extends Component { props: Props; }',
            propTypesSrc,
          ),
        ),
      );
    });

    describe('stateless component', () => {
      test(
        propTypesSrc =>
          parse
            .statement(template('(props: Props) => <div />;', propTypesSrc))
            .get('expression') as NodePath<ArrowFunctionExpression>,
      );
    });
  });

  describe('does not error if flowTypes cannot be found', () => {
    it('ObjectExpression', () => {
      const definition = parse.expression<ObjectExpression>('{fooBar: 42}');

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
    });

    it('ClassDeclaration', () => {
      const definition = parse.statement<ClassDeclaration>(
        'class Foo extends Component {}',
      );

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
    });

    it('ArrowFunctionExpression', () => {
      const definition =
        parse.statement<ArrowFunctionExpression>('() => <div />');

      expect(() => codeTypeHandler(documentation, definition)).not.toThrow();
    });
  });

  it('supports intersection proptypes', () => {
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

  it('does support utility types inline', () => {
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

  it('does not support union proptypes', () => {
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
    it('does not resolve type included by require', () => {
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

    it('imported', () => {
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

    it('type not imported', () => {
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

    it('type imported', () => {
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

    it('does not resolve types not in scope', () => {
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

    it('does not resolve types not in scope', () => {
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
    it('resolves prop type from function expression', () => {
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

    it('resolves when the function is not inline', () => {
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

    it('resolves when the function is rebound and not inline', () => {
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
