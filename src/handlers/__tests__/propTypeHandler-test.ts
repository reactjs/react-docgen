import { parse, makeMockImporter, noopImporter } from '../../../tests/utils';
import Documentation from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import { propTypeHandler } from '../propTypeHandler';
import getPropType from '../../utils/getPropType';
import type { NodePath } from '@babel/traverse';
import type { Importer } from '../../importer';
import type { ExpressionStatement } from '@babel/types';

const getPropTypeMock = getPropType as jest.Mock;

jest.mock('../../Documentation');
jest.mock('../../utils/getPropType', () => jest.fn(() => ({})));

describe('propTypeHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    props: stmtLast =>
      stmtLast(`
      import { PropTypes } from 'react';
      export default {bar: PropTypes.bool};
    `).get('declaration'),

    simpleProp: stmtLast =>
      stmtLast(`
      import { PropTypes } from 'react';
      export default PropTypes.array.isRequired;
    `).get('declaration'),

    complexProp: stmtLast =>
      stmtLast(`
      var prop = PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired;
      import { PropTypes } from 'react';
      export default prop;
    `).get('declaration'),

    foo: stmtLast =>
      stmtLast(`
        import { PropTypes } from 'react';
        export default PropTypes.bool;
    `).get('declaration'),

    bar: stmtLast =>
      stmtLast(`
        import { PropTypes } from 'react';
        export default PropTypes.bool;
    `).get('declaration'),

    baz: stmtLast =>
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

  function test(
    getSrc: (src: string) => string,
    parseSrc: (src: string, importer?: Importer) => NodePath,
  ) {
    it('passes the correct argument to getPropType', () => {
      const propTypesSrc = `{
          foo: PropTypes.bool,
          abc: PropTypes.xyz,
        }`;
      const definition = parseSrc(getSrc(propTypesSrc));
      const propTypesAST = parse.expression(propTypesSrc);

      const fooPath = propTypesAST.get('properties.0.value') as NodePath;
      const xyzPath = propTypesAST.get('properties.1.value') as NodePath;

      propTypeHandler(documentation, definition);

      expect(getPropTypeMock.mock.calls[0][0]).toEqualASTNode(fooPath);
      expect(getPropTypeMock.mock.calls[1][0]).toEqualASTNode(xyzPath);
    });

    it('finds definitions via React.PropTypes', () => {
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

    it('finds definitions via the ReactPropTypes module', () => {
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

    it('detects whether a prop is required', () => {
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

    it('handles computed properties', () => {
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

    it('ignores complex computed properties', () => {
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

    it('only considers definitions from React or ReactPropTypes', () => {
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

    it('resolves variables', () => {
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

    it('resolves imported variables', () => {
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

    it('can resolve individual imported variables assigned to props', () => {
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
    test(
      propTypesSrc => template(`({propTypes: ${propTypesSrc}})`),
      (src, importer = noopImporter) =>
        parse.statement<ExpressionStatement>(src, importer).get('expression'),
    );
  });

  describe('class definition', () => {
    describe('class property', () => {
      test(
        propTypesSrc =>
          template(`
          class Component {
            static propTypes = ${propTypesSrc};
          }
        `),
        (src, importer = noopImporter) => parse.statement(src, importer),
      );
    });

    describe('static getter', () => {
      test(
        propTypesSrc =>
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
    test(
      propTypesSrc =>
        template(`
        var Component = (props) => <div />;
        Component.propTypes = ${propTypesSrc};
      `),
      (src, importer = noopImporter) => parse.statement(src, importer),
    );
  });

  it('does not error if propTypes cannot be found', () => {
    let definition = parse.expression('{fooBar: 42}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();

    definition = parse.statement('class Foo {}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();

    definition = parse.statement('function Foo() {}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();

    definition = parse.expression('() => {}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();
  });

  // This case is handled by propTypeCompositionHandler
  it('does not error if propTypes is a member expression', () => {
    const definition = parse.expression('{propTypes: Foo.propTypes}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();
  });
});
