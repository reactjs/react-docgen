/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('../../Documentation');
jest.mock('../../utils/getPropType', () => jest.fn(() => ({})));

import {
  statement,
  expression,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';
import Documentation from '../../Documentation';
import { propTypeHandler } from '../propTypeHandler';

describe('propTypeHandler', () => {
  let getPropTypeMock;
  let documentation;

  beforeEach(() => {
    getPropTypeMock = require('../../utils/getPropType');
    documentation = new Documentation();
  });

  const mockImporter = makeMockImporter({
    props: statement(`
      export default {bar: PropTypes.bool};
      import { PropTypes } from 'react';
    `).get('declaration'),

    simpleProp: statement(`
      export default PropTypes.array.isRequired;
      import { PropTypes } from 'react';
    `).get('declaration'),

    complexProp: statement(`
      export default prop;
      var prop = PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired;
      import { PropTypes } from 'react';
    `).get('declaration'),

    foo: statement(`
      export default PropTypes.bool;
      import { PropTypes } from 'react';
    `).get('declaration'),

    bar: statement(`
      export default PropTypes.bool;
      import { PropTypes } from 'react';
    `).get('declaration'),

    baz: statement(`
      export default OtherPropTypes.bool;
      import { PropTypes as OtherPropTypes } from 'react';
    `).get('declaration'),
  });

  function template(src) {
    return `
      ${src}
      var React = require('React');
      var PropTypes = React.PropTypes;
      var {PropTypes: OtherPropTypes} = React;
    `;
  }

  function test(getSrc, parse) {
    it('passes the correct argument to getPropType', () => {
      const propTypesSrc = `{
          foo: PropTypes.bool,
          abc: PropTypes.xyz,
        }`;
      const definition = parse(getSrc(propTypesSrc));
      const propTypesAST = expression(propTypesSrc);

      const fooPath = propTypesAST.get('properties', 0, 'value');
      const xyzPath = propTypesAST.get('properties', 1, 'value');

      propTypeHandler(documentation, definition, noopImporter);

      expect(getPropTypeMock.mock.calls[0][0]).toEqualASTNode(fooPath);
      expect(getPropTypeMock.mock.calls[1][0]).toEqualASTNode(xyzPath);
    });

    it('finds definitions via React.PropTypes', () => {
      const definition = parse(
        getSrc(
          `{
          foo: PropTypes.bool,
          bar: require("react").PropTypes.bool,
          baz: OtherPropTypes.bool,
        }`,
        ),
      );

      propTypeHandler(documentation, definition, noopImporter);
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
      const definition = parse(
        getSrc(
          `{
          foo: require("ReactPropTypes").bool,
        }`,
        ),
      );

      propTypeHandler(documentation, definition, noopImporter);
      expect(documentation.descriptors).toEqual({
        foo: {
          type: {},
          required: false,
        },
      });
    });

    it('detects whether a prop is required', () => {
      const definition = parse(
        getSrc(
          `{
          simple_prop: PropTypes.array.isRequired,
          complex_prop:
            PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
        }`,
        ),
      );

      propTypeHandler(documentation, definition, noopImporter);
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
      const definition = parse(
        getSrc(
          `{
          [foo]: PropTypes.array.isRequired,
          complex_prop:
            PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
        }`,
        ),
      );

      propTypeHandler(documentation, definition, noopImporter);
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('ignores complex computed properties', () => {
      const definition = parse(
        getSrc(
          `{
          [() => {}]: PropTypes.array.isRequired,
          complex_prop:
            PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
        }`,
        ),
      );

      propTypeHandler(documentation, definition, noopImporter);
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('only considers definitions from React or ReactPropTypes', () => {
      const definition = parse(
        getSrc(
          `{
          custom_propA: PropTypes.bool,
          custom_propB: Prop.bool.isRequired,
        }`,
        ),
      );

      propTypeHandler(documentation, definition, noopImporter);
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
      const definition = parse(`
        ${definitionSrc}
        var props = {bar: PropTypes.bool};
      `);

      propTypeHandler(documentation, definition, noopImporter);
      expect(documentation.descriptors).toEqual({
        bar: {
          type: {},
          required: false,
        },
      });
    });

    it('resolves imported variables', () => {
      const definitionSrc = getSrc('props');
      const definition = parse(`
        ${definitionSrc}
        import props from 'props';
      `);

      propTypeHandler(documentation, definition, mockImporter);
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
      const definition = parse(`
        ${definitionSrc}
        import foo from 'foo';
        import bar from 'bar';
        import baz from 'baz';
        import simpleProp from 'simpleProp';
        import complexProp from 'complexProp';
      `);

      propTypeHandler(documentation, definition, mockImporter);
      expect(documentation.descriptors).toMatchSnapshot();
    });
  }

  describe('React.createClass', () => {
    test(
      propTypesSrc => template(`({propTypes: ${propTypesSrc}})`),
      src => statement(src).get('expression'),
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
        src => statement(src),
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
        src => statement(src),
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
      src => statement(src),
    );
  });

  it('does not error if propTypes cannot be found', () => {
    let definition = expression('{fooBar: 42}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();

    definition = statement('class Foo {}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();

    definition = statement('function Foo() {}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();

    definition = expression('() => {}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();
  });

  // This case is handled by propTypeCompositionHandler
  it('does not error if propTypes is a member expression', () => {
    const definition = expression('{propTypes: Foo.propTypes}');
    expect(() => propTypeHandler(documentation, definition)).not.toThrow();
  });
});
