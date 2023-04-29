import type { NodePath } from '@babel/traverse';
import type {
  ArrowFunctionExpression,
  CallExpression,
  ClassDeclaration,
  ClassExpression,
  ObjectExpression,
  VariableDeclaration,
} from '@babel/types';
import { parse, makeMockImporter } from '../../../tests/utils';
import DocumentationBuilder from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import defaultPropsHandler from '../defaultPropsHandler.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../Documentation.js');

describe('defaultPropsHandler', () => {
  let documentation: DocumentationBuilder & DocumentationMock;

  beforeEach(() => {
    documentation = new DocumentationBuilder() as DocumentationBuilder &
      DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    getDefaultProps: (stmtLast) =>
      stmtLast(`
      import baz from 'baz';
      export default function() {
        return {
          foo: "bar",
          bar: 42,
          baz: baz,
          abc: {xyz: abc.def, 123: 42}
        };
      }
    `).get('declaration'),

    baz: (stmtLast) =>
      stmtLast(`
      export default ["foo", "bar"];
    `).get('declaration'),

    other: (stmtLast) =>
      stmtLast(`
      export default { bar: "foo" };
    `).get('declaration'),

    defaultProps: (stmtLast) =>
      stmtLast(`
      export default {
        foo: "bar",
        bar: 42,
        baz: ["foo", "bar"],
        abc: {xyz: abc.def, 123: 42}
      };
    `).get('declaration'),
  });

  describe('ObjectExpression', () => {
    test('should find prop default values that are literals', () => {
      const src = `
        {
          getDefaultProps: function() {
            return {
              foo: "bar",
              bar: 42,
              falseliteral: false,
              trueliteral: true,
              nullliteral: null,
              regex: /./,
              bigint: 1n,
              baz: ["foo", "bar"],
              abc: {xyz: abc.def, 123: 42}
            };
          }
        }
      `;

      defaultPropsHandler(
        documentation,
        parse.expression<ObjectExpression>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('can resolve object methods', () => {
      const src = `
        {
          getDefaultProps() {
            return {
              foo: "bar",
            };
          }
        }
      `;

      defaultPropsHandler(
        documentation,
        parse.expression<ObjectExpression>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('can resolve declared functions', () => {
      const src = `
        function getDefaultProps() {
          return {
            foo: "bar",
            bar: 42,
            baz: ["foo", "bar"],
            abc: {xyz: abc.def, 123: 42}
          };
        }
        ({
          getDefaultProps: getDefaultProps
        })
      `;

      defaultPropsHandler(documentation, parse.expressionLast(src));
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('should find prop default values that are literals from imported functions', () => {
      const src = `
        import getDefaultProps from 'getDefaultProps';

        ({
          getDefaultProps: getDefaultProps
        })
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('handles computed properties', () => {
      const src = `
        {
          getDefaultProps: function() {
            return {
              foo: "bar",
              [bar]: 42,
            };
          }
        }
      `;

      defaultPropsHandler(
        documentation,
        parse.expression<ObjectExpression>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('handles imported values assigned to computed properties', () => {
      const src = `
        import baz from 'baz';
        ({
          getDefaultProps: function() {
            return {
              foo: "bar",
              [bar]: baz,
            };
          }
        })
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('ignores complex computed properties', () => {
      const src = `
        ({
          getDefaultProps: function() {
            return {
              foo: "bar",
              [() => {}]: 42,
            };
          }
        })
      `;

      defaultPropsHandler(documentation, parse.expressionLast(src));
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('ignores imported values assigned to complex computed properties', () => {
      const src = `
        import baz from 'baz';
        ({
          getDefaultProps: function() {
            return {
              foo: "bar",
              [() => {}]: baz,
            };
          }
        })
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves local spreads', () => {
      const src = `
        const other = { bar: "foo" };

        ({
          getDefaultProps: function() {
            return {
              foo: "bar",
              ...other,
            };
          }
        })
      `;

      defaultPropsHandler(documentation, parse.expressionLast(src));
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves imported spreads', () => {
      const src = `
        import other from 'other';
        ({
          getDefaultProps: function() {
            return {
              foo: "bar",
              ...other,
            };
          }
        })
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });

  describe('ClassDeclaration with static defaultProps', () => {
    test('should find prop default values that are literals', () => {
      const src = `
        class Foo {
          static defaultProps = {
            foo: "bar",
            bar: 42,
            baz: ["foo", "bar"],
            abc: {xyz: abc.def, 123: 42}
          };
        }
      `;

      defaultPropsHandler(
        documentation,
        parse.statement<ClassDeclaration>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('should find prop default values that are literals', () => {
      const src = `
        class Foo {
          static get defaultProps() {
            return {
              foo: "bar",
            };
          }
        }
      `;

      defaultPropsHandler(
        documentation,
        parse.statement<ClassDeclaration>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves imported values assigned as default props', () => {
      const src = `
        import defaultProps from 'defaultProps';
        class Foo {
          static defaultProps = defaultProps;
        }
      `;

      defaultPropsHandler(
        documentation,
        parse.statementLast(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('should resolve local spreads', () => {
      const src = `
        const other = { bar: "foo" };

        class Foo {
          static defaultProps = {
            foo: "bar",
            ...other
          };
        }
      `;

      defaultPropsHandler(documentation, parse.statementLast(src));
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves imported spreads', () => {
      const src = `
        import other from 'other';
        class Foo {
          static defaultProps = {
            foo: "bar",
            ...other
          };
        }
      `;

      defaultPropsHandler(
        documentation,
        parse.statementLast(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('should find prop default values that are imported variables', () => {
      const src = `
        import ImportedComponent from './ImportedComponent.js';

        class Foo {
          static defaultProps = {
            foo: ImportedComponent,
          };
        }
      `;

      defaultPropsHandler(documentation, parse.statementLast(src));
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('can resolve default props that are imported given a custom importer', () => {
      const src = `
        import baz from 'baz';

        class Foo {
          static defaultProps = {
            baz: baz,
          };
        }
      `;

      defaultPropsHandler(
        documentation,
        parse.statementLast(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });

  describe('ClassExpression with static defaultProps', () => {
    test('should find prop default values that are literals', () => {
      const src = `
        var Bar = class {
          static defaultProps = {
            foo: "bar",
            bar: 42,
            baz: ["foo", "bar"],
            abc: {xyz: abc.def, 123: 42}
          };
      }`;

      defaultPropsHandler(
        documentation,
        parse
          .statement(src)
          .get('declarations.0.init') as NodePath<ClassExpression>,
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves imported values assigned as default props', () => {
      const src = `
        import defaultProps from 'defaultProps';
        var Bar = class {
          static defaultProps = defaultProps;
        }
      `;

      defaultPropsHandler(
        documentation,
        parse
          .statementLast(src, mockImporter)
          .get('declarations.0.init') as NodePath<ClassExpression>,
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });

  test('should only consider Property nodes, not e.g. spread properties', () => {
    const src = `
      {
        getDefaultProps: function() {
          return {
            ...Foo.bar,
            bar: 42,
          };
        }
      }
    `;
    const definition = parse.expression<ObjectExpression>(src);

    expect(() => defaultPropsHandler(documentation, definition)).not.toThrow();
    expect(documentation.descriptors).toMatchSnapshot();
  });

  test('can have an importer that resolves spread properties', () => {
    const src = `
      import Props from 'defaultProps';
      ({
        getDefaultProps: function() {
          return {
            ...Props.abc,
            bar: 42,
          };
        }
      })
    `;
    const definition = parse.expressionLast<ObjectExpression>(
      src,
      mockImporter,
    );

    expect(() => defaultPropsHandler(documentation, definition)).not.toThrow();
    expect(documentation.descriptors).toMatchSnapshot();
  });

  describe('Functional components with default params', () => {
    test('should find default props that are literals', () => {
      const src = `
        ({
          foo = "bar",
          bar = 42,
          baz = ["foo", "bar"],
          abc = {xyz: abc.def, 123: 42}
        }) => <div />
      `;

      defaultPropsHandler(documentation, parse.expressionLast(src));
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('can use imported values as default props', () => {
      const src = `
        import baz from 'baz';
        ({
          bar = baz,
        }) => <div />
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('should override with defaultProps if available', () => {
      const src = `
        var Foo = ({
          foo = "bar",
          bar = 42,
          baz = ["foo", "bar"],
          abc = 'test'
        }) => <div />
        Foo.defaultProps = { abc: {xyz: abc.def, 123: 42} };
      `;

      defaultPropsHandler(
        documentation,
        parse
          .statement(src)
          .get('declarations.0.init') as NodePath<ArrowFunctionExpression>,
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('overrides with imported defaultProps', () => {
      const src = `
        import other from 'other';
        var Foo = ({
          bar = 42,
        }) => <div />
        Foo.defaultProps = other;
      `;

      defaultPropsHandler(
        documentation,
        parse
          .statement(src, mockImporter, 1)
          .get('declarations.0.init') as NodePath<ArrowFunctionExpression>,
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves local spreads', () => {
      const src = `
        const other = { bar: "foo" };
        var Foo = (props) => <div />
        Foo.defaultProps = { foo: "bar", ...other };
      `;

      defaultPropsHandler(
        documentation,
        parse
          .statement(src, 1)
          .get('declarations.0.init') as NodePath<ArrowFunctionExpression>,
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves imported spreads', () => {
      const src = `
        import other from 'other';
        var Foo = (props) => <div />
        Foo.defaultProps = { foo: "bar", ...other };
      `;

      defaultPropsHandler(
        documentation,
        parse
          .statement(src, mockImporter, 1)
          .get('declarations.0.init') as NodePath<ArrowFunctionExpression>,
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('should work with aliases', () => {
      const src = `
        ({
          foo = "bar",
          bar = 42,
          baz = ["foo", "bar"],
          abc: defg = {xyz: abc.def, 123: 42}
        }) => <div />
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast<ArrowFunctionExpression>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('allows imported defaults to be aliased', () => {
      const src = `
        import baz from 'baz';
        ({
          foo: bar = baz,
        }) => <div />
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast<ArrowFunctionExpression>(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('should find prop default values that are imported variables', () => {
      const src = `
        import ImportedComponent from './ImportedComponent.js';

        ({
          foo = ImportedComponent,
        }) => <div />
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast<ArrowFunctionExpression>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('should work with no defaults', () => {
      const src = `({ foo }) => <div />`;

      defaultPropsHandler(
        documentation,
        parse.expressionLast<ArrowFunctionExpression>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });

  describe('forwardRef', () => {
    test('resolves default props in the parameters', () => {
      const src = `
        import React from 'react';
        React.forwardRef(({ foo = 'bar' }, ref) => <div ref={ref}>{foo}</div>);
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast<CallExpression>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves imported default props in the parameters', () => {
      const src = `
        import baz from 'baz';
        import React from 'react';
        React.forwardRef(({ bar = baz }, ref) => <div ref={ref}>{bar}</div>);
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast<CallExpression>(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves defaultProps', () => {
      const src = `
        import React from 'react';
        const Component = React.forwardRef(({ foo }, ref) => <div ref={ref}>{foo}</div>);
        Component.defaultProps = { foo: 'baz' };
      `;

      defaultPropsHandler(
        documentation,
        parse
          .statement<VariableDeclaration>(src, 1)
          .get('declarations.0.init') as NodePath<CallExpression>,
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves imported defaultProps', () => {
      const src = `
        import other from 'other';
        import React from 'react';
        const Component = React.forwardRef(({ bar }, ref) => <div ref={ref}>{bar}</div>);
        Component.defaultProps = other;
      `;

      defaultPropsHandler(
        documentation,
        parse
          .statement(src, mockImporter, 2)
          .get('declarations.0.init') as NodePath<CallExpression>,
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('resolves when the function is not inline', () => {
      const src = `
        import React from 'react';
        const ComponentImpl = ({ foo = 'bar' }, ref) => <div ref={ref}>{foo}</div>;
        React.forwardRef(ComponentImpl);
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast<CallExpression>(src),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('also resolves imports when the function is not inline', () => {
      const src = `
        import baz from 'baz';
        import React from 'react';
        const ComponentImpl = ({ bar = baz }, ref) => <div ref={ref}>{bar}</div>;
        React.forwardRef(ComponentImpl);
      `;

      defaultPropsHandler(
        documentation,
        parse.expressionLast<CallExpression>(src, mockImporter),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });
});
