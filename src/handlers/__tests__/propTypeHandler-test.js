/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, it, expect, beforeEach*/

jest.autoMockOff();
jest.mock('../../Documentation');

describe('propTypeHandler', () => {
  var statement, expression;
  var getPropTypeMock;
  var documentation;
  var propTypeHandler;

  beforeEach(() => {
    ({statement, expression} = require('../../../tests/utils'));
    getPropTypeMock = jest.genMockFunction().mockImplementation(() => ({}));
    jest.setMock('../../utils/getPropType', getPropTypeMock);
    jest.mock('../../utils/getPropType');

    documentation = new (require('../../Documentation'));
    propTypeHandler = require('../propTypeHandler');
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
      var propTypesSrc = `
        {
          foo: PropTypes.bool,
          abc: PropTypes.xyz,
        }
      `;
      var definition = parse(getSrc(propTypesSrc));
      var propTypesAST = expression(propTypesSrc);

      var fooPath = propTypesAST.get('properties', 0, 'value');
      var xyzPath = propTypesAST.get('properties', 1, 'value');

      propTypeHandler(documentation, definition);

      expect(getPropTypeMock.mock.calls[0][0].node)
        .toEqualASTNode(fooPath.node);
      expect(getPropTypeMock.mock.calls[1][0].node)
        .toEqualASTNode(xyzPath.node);
    });

    it('finds definitions via React.PropTypes', () => {
      var definition = parse(getSrc(`
        {
          foo: PropTypes.bool,
          bar: require("react").PropTypes.bool,
          baz: OtherPropTypes.bool,
        }
      `));

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
      var definition = parse(getSrc(`
        {
          foo: require("ReactPropTypes").bool,
        }
      `));

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          type: {},
          required: false,
        },
      });
    });

    it('detects whether a prop is required', () => {
      var definition = parse(getSrc(`
        {
          simple_prop: PropTypes.array.isRequired,
          complex_prop:
            PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
        }
      `));

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
          simple_prop: { // eslint-disable-line camelcase
            type: {},
            required: true,
          },
          complex_prop: { // eslint-disable-line camelcase
            type: {},
            required: true,
          },
      });
    });

    it('only considers definitions from React or ReactPropTypes', () => {
      var definition = parse(getSrc(`
        {
          custom_propA: PropTypes.bool,
          custom_propB: Prop.bool.isRequired,
        }
      `));

      propTypeHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        custom_propA: { // eslint-disable-line camelcase
          type: {},
          required: false,
        },
        custom_propB: { // eslint-disable-line camelcase
          type: {
            name: 'custom',
            raw: 'Prop.bool.isRequired',
          },
          required: false,
        },
      });
    });

    it('resolves variables', () => {
      var definitionSrc = getSrc('props');
      var definition = parse(`
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

  }

  describe('React.createClass', () => {
    test(
      propTypesSrc => template(`({propTypes: ${propTypesSrc}})`),
      src => statement(src).get('expression')
    );
  });

  describe('class definition', () => {
    test(
      propTypesSrc => template(`
        class Component {
          static propTypes = ${propTypesSrc};
        }
      `),
      src => statement(src)
    );
  });

  describe('stateless component', () => {
    test(
      propTypesSrc => template(`
        var Component = (props) => <div />;
        Component.propTypes = ${propTypesSrc};
      `),
      src => statement(src)
    );
  });

  it('does not error if propTypes cannot be found', () => {
    var definition = expression('{fooBar: 42}');
    expect(() => propTypeHandler(documentation, definition))
      .not.toThrow();

    definition = statement('class Foo {}');
    expect(() => propTypeHandler(documentation, definition))
      .not.toThrow();
  });
});
