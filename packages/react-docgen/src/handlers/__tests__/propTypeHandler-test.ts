import { parse, makeMockImporter, noopImporter } from '../../../tests/utils';
import DocumentationBuilder from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import { propTypeHandler } from '../propTypeHandler.js';
import getPropType from '../../utils/getPropType';
import type { NodePath } from '@babel/traverse';
import type { Importer } from '../../importer';
import type {
  ArrowFunctionExpression,
  ClassDeclaration,
  FunctionDeclaration,
  ObjectExpression,
} from '@babel/types';
import type { ComponentNode } from '../../resolver';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const getPropTypeMock = vi.mocked(getPropType);

vi.mock('../../Documentation.js');
vi.mock('../../utils/getPropType.js', () => ({ default: vi.fn(() => ({})) }));

describe('propTypeHandler', () => {
  let documentation: DocumentationBuilder & DocumentationMock;

  beforeEach(() => {
    documentation = new DocumentationBuilder() as DocumentationBuilder &
      DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    props: (stmtLast) =>
      stmtLast(`
      import { PropTypes } from 'react';
      export default {bar: PropTypes.bool};
    `).get('declaration'),

    simpleProp: (stmtLast) =>
      stmtLast(`
      import { PropTypes } from 'react';
      export default PropTypes.array.isRequired;
    `).get('declaration'),

    complexProp: (stmtLast) =>
      stmtLast(`
      var prop = PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired;
      import { PropTypes } from 'react';
      export default prop;
    `).get('declaration'),

    foo: (stmtLast) =>
      stmtLast(`
        import { PropTypes } from 'react';
        export default PropTypes.bool;
    `).get('declaration'),

    bar: (stmtLast) =>
      stmtLast(`
        import { PropTypes } from 'react';
        export default PropTypes.bool;
    `).get('declaration'),

    baz: (stmtLast) =>
      stmtLast(`
        import { PropTypes as OtherPropTypes } from 'react';
        export default OtherPropTypes.bool;
    `).get('declaration'),
  });

  function template(src: string) {
    return `
      ${src}
      var React = require('React');
      var PropTypes = React.PropTypes;
      var {PropTypes: OtherPropTypes} = React;
    `;
  }

  function testPropTypes(
    getSrc: (src: string) => string,
    parseSrc: (src: string, importer?: Importer) => NodePath<ComponentNode>,
  ) {
    test('passes the correct argument to getPropType', () => {
      const propTypesSrc = `{
          foo: PropTypes.bool,
          abc: PropTypes.xyz,
        }`;
      const definition = parseSrc(getSrc(propTypesSrc));

      propTypeHandler(documentation, definition);

      expect(getPropTypeMock.mock.calls[0][0]).toMatchSnapshot();
      expect(getPropTypeMock.mock.calls[1][0]).toMatchSnapshot();
    });

    test('finds definitions via React.PropTypes', () => {
      const definition = parseSrc(
        getSrc(
          `{
          foo: PropTypes.bool,
          bar: require("react").PropTypes.bool,
          baz: OtherPropTypes.bool,
        }`,
        ),
      );

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          type: {},
          required: false,
        },
        bar: {
          type: {},
          required: false,
        },
        baz: {
          type: {},
          required: false,
        },
      });
    });

    test('finds definitions via the ReactPropTypes module', () => {
      const definition = parseSrc(
        getSrc(
          `{
          foo: require("ReactPropTypes").bool,
        }`,
        ),
      );

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          type: {},
          required: false,
        },
      });
    });

    test('detects whether a prop is required', () => {
      const definition = parseSrc(
        getSrc(
          `{
          simple_prop: PropTypes.array.isRequired,
          complex_prop:
            PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
        }`,
        ),
      );

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        simple_prop: {
          type: {},
          required: true,
        },
        complex_prop: {
          type: {},
          required: true,
        },
      });
    });

    test('handles computed properties', () => {
      const definition = parseSrc(
        getSrc(
          `{
          [foo]: PropTypes.array.isRequired,
          complex_prop:
            PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
        }`,
        ),
      );

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('ignores complex computed properties', () => {
      const definition = parseSrc(
        getSrc(
          `{
          [() => {}]: PropTypes.array.isRequired,
          complex_prop:
            PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
        }`,
        ),
      );

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toMatchSnapshot();
    });

    test('only considers definitions from React or ReactPropTypes', () => {
      const definition = parseSrc(
        getSrc(
          `{
          custom_propA: PropTypes.bool,
          custom_propB: Prop.bool.isRequired,
        }`,
        ),
      );

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        custom_propA: {
          type: {},
          required: false,
        },
        custom_propB: {
          type: {
            name: 'custom',
            raw: 'Prop.bool.isRequired',
          },
          required: false,
        },
      });
    });

    test('resolves variables', () => {
      const definitionSrc = getSrc('props');
      const definition = parseSrc(`
        ${definitionSrc}
        var props = {bar: PropTypes.bool};
      `);

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        bar: {
          type: {},
          required: false,
        },
      });
    });

    test('resolves imported variables', () => {
      const definitionSrc = getSrc('props');
      const definition = parseSrc(
        `
        ${definitionSrc}
        import props from 'props';
      `,
        mockImporter,
      );

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        bar: {
          type: {},
          required: false,
        },
      });
    });

    test('can resolve individual imported variables assigned to props', () => {
      const definitionSrc = getSrc(`{
        foo: foo,
        [bar]: bar,
        baz: baz,
        simple_prop: simpleProp,
        complex_prop: complexProp,
      }`);
      const definition = parseSrc(
        `
        ${definitionSrc}
        import foo from 'foo';
        import bar from 'bar';
        import baz from 'baz';
        import simpleProp from 'simpleProp';
        import complexProp from 'complexProp';
      `,
        mockImporter,
      );

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toMatchSnapshot();
    });
  }

  describe('React.createClass', () => {
    testPropTypes(
      (propTypesSrc) => template(`({propTypes: ${propTypesSrc}})`),
      (src, importer = noopImporter) =>
        parse
          .statement(src, importer)
          .get('expression') as NodePath<ObjectExpression>,
    );
  });

  describe('class definition', () => {
    describe('class property', () => {
      testPropTypes(
        (propTypesSrc) =>
          template(`
          class Component {
            static propTypes = ${propTypesSrc};
          }
        `),
        (src, importer = noopImporter) => parse.statement(src, importer),
      );
    });

    describe('static getter', () => {
      testPropTypes(
        (propTypesSrc) =>
          template(`
          class Component {
            static get propTypes() {
              return ${propTypesSrc};
            }
          }
        `),
        (src, importer = noopImporter) => parse.statement(src, importer),
      );
    });
  });

  describe('stateless component', () => {
    testPropTypes(
      (propTypesSrc) =>
        template(`
        var Component = (props) => <div />;
        Component.propTypes = ${propTypesSrc};
      `),
      (src, importer = noopImporter) => parse.statement(src, importer),
    );
  });

  describe('does not error if propTypes cannot be found', () => {
    test('ObjectExpression', () => {
      const definition = parse.expression<ObjectExpression>('{fooBar: 42}');

      expect(() => propTypeHandler(documentation, definition)).not.toThrow();
    });

    test('ClassDeclaration', () => {
      const definition = parse.statement<ClassDeclaration>('class Foo {}');

      expect(() => propTypeHandler(documentation, definition)).not.toThrow();
    });

    test('FunctionDeclaration', () => {
      const definition =
        parse.statement<FunctionDeclaration>('function Foo() {}');

      expect(() => propTypeHandler(documentation, definition)).not.toThrow();
    });

    test('ArrowFunctionExpression', () => {
      const definition = parse.expression<ArrowFunctionExpression>('() => {}');

      expect(() => propTypeHandler(documentation, definition)).not.toThrow();
    });
  });

  // This case is handled by propTypeCompositionHandler
  test('does not error if propTypes is a member expression', () => {
    const definition = parse.expression<ObjectExpression>(
      '{propTypes: Foo.propTypes}',
    );

    expect(() => propTypeHandler(documentation, definition)).not.toThrow();
  });
});
