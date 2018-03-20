/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('getPropType', () => {
  var expression, statement;
  var getPropType;

  beforeEach(() => {
    getPropType = require('../getPropType').default;
    ({expression, statement} = require('../../../tests/utils'));
  });

  it('detects simple prop types', () => {
    var simplePropTypes = [
      'array',
      'bool',
      'func',
      'number',
      'object',
      'string',
      'any',
      'element',
      'node',
      'symbol',
    ];

    simplePropTypes.forEach(
      type => expect(getPropType(expression('React.PropTypes.' + type)))
        .toEqual({name: type})
    );

    // It doesn't actually matter what the MemberExpression is
    simplePropTypes.forEach(
      type => expect(getPropType(expression('Foo.' + type + '.bar')))
        .toEqual({name: type})
    );

    // Doesn't even have to be a MemberExpression
    simplePropTypes.forEach(
      type => expect(getPropType(expression(type)))
        .toEqual({name: type})
    );
  });

  it('detects complex prop types', () => {
    expect(getPropType(expression('oneOf(["foo", "bar"])'))).toEqual({
      name: 'enum',
      required: false,
      value: [
        {value: '"foo"', computed: false},
        {value: '"bar"', computed: false},
      ],
    });

    // line comments are ignored
    expect(getPropType(expression('oneOf(["foo", // baz\n"bar"])'))).toEqual({
      name: 'enum',
      required: false,
      value: [
        {value: '"foo"', computed: false},
        {value: '"bar"', computed: false},
      ],
    });

    expect(getPropType(expression('oneOfType([number, bool])'))).toEqual({
      name: 'union',
      required: false,
      value: [
        {name: 'number'},
        {name: 'bool'},
      ],
    });

    // custom type
    expect(getPropType(expression('oneOfType([foo])'))).toEqual({
      name: 'union',
      required: false,
      value: [{name: 'custom', raw: 'foo'}],
    });

    expect(getPropType(expression('instanceOf(Foo)'))).toEqual({
      name: 'instanceOf',
      required: false,
      value: 'Foo',
    });

    expect(getPropType(expression('arrayOf(string)'))).toEqual({
      name: 'arrayOf',
      required: false,
      value: {name: 'string'},
    });

    expect(getPropType(expression('objectOf(string)'))).toEqual({
      name: 'objectOf',
      required: false,
      value: {name: 'string'},
    });

    expect(getPropType(expression('shape({foo: string, bar: bool})'))).toEqual({
      name: 'shape',
      required: false,
      value: {
        foo: {
          name: 'string',
          required: false,
        },
        bar: {
          name: 'bool',
          required: false,
        },
      },
    });

    // custom
    expect(getPropType(expression('shape({foo: xyz})'))).toEqual({
      name: 'shape',
      required: false,
      value: {
        foo: {
          name: 'custom',
          raw: 'xyz',
          required: false,
        },
      },
    });

    // computed
    expect(getPropType(expression('shape(Child.propTypes)'))).toEqual({
      name: 'shape',
      required: false,
      value: 'Child.propTypes',
      computed: true,
    });
  });

  describe('resolve identifier to their values', () => {
    it('resolves variables to their values', () => {
      var propTypeExpression = statement(`
        PropTypes.shape(shape);
        var shape = {bar: PropTypes.string};
      `).get('expression');

      expect(getPropType(propTypeExpression)).toEqual({
        name: 'shape',
        required: false,
        value: {
          bar: {
            name: 'string',
            required: false,
          },
        },
      });
    });

    it('resolves simple identifier to their initialization value', () => {
      var propTypeIdentifier = statement(`
        PropTypes.oneOf(TYPES);
        var TYPES = ["foo", "bar"];
      `).get('expression');

      expect(getPropType(propTypeIdentifier)).toEqual({
        name: 'enum',
        required: false,
        value: [
          {value: '"foo"', computed: false},
          {value: '"bar"', computed: false},
        ],
      });

      var identifierInsideArray = statement(`
        PropTypes.oneOf([FOO, BAR]);
        var FOO = "foo";
        var BAR = "bar";
      `).get('expression');

      expect(getPropType(identifierInsideArray)).toEqual({
        name: 'enum',
        required: false,
        value: [
          {value: '"foo"', computed: false},
          {value: '"bar"', computed: false},
        ],
      });

    });

    it('resolves memberExpressions', () => {
      var propTypeExpression = statement(`
        PropTypes.oneOf([TYPES.FOO, TYPES.BAR]);
        var TYPES = { FOO: "foo", BAR: "bar" };
      `).get('expression');

      expect(getPropType(propTypeExpression)).toEqual({
        name: 'enum',
        required: false,
        value: [
          {value: '"foo"', computed: false},
          {value: '"bar"', computed: false},
        ],
      });
    });

    it('correctly resolves SpreadElements in arrays', () => {
      var propTypeExpression = statement(`
        PropTypes.oneOf([...TYPES]);
        var TYPES = ["foo", "bar"];
      `).get('expression');

      expect(getPropType(propTypeExpression)).toEqual({
        name: 'enum',
        required: false,
        value: [
          {value: '"foo"', computed: false},
          {value: '"bar"', computed: false},
        ],
      });
    });

    it('correctly resolves nested SpreadElements in arrays', () => {
      var propTypeExpression = statement(`
        PropTypes.oneOf([...TYPES]);
        var TYPES = ["foo", ...TYPES2];
        var TYPES2 = ["bar"];
      `).get('expression');

      expect(getPropType(propTypeExpression)).toEqual({
        name: 'enum',
        required: false,
        value: [
          {value: '"foo"', computed: false},
          {value: '"bar"', computed: false},
        ],
      });
    });

    it('does not resolve computed values', () => {
      var propTypeExpression = statement(`
        PropTypes.oneOf(Object.keys(TYPES));
        var TYPES = { FOO: "foo", BAR: "bar" };
      `).get('expression');

      expect(getPropType(propTypeExpression)).toEqual({
        name: 'enum',
        required: false,
        value: [
          {value: '"FOO"', computed: false},
          {value: '"BAR"', computed: false},
        ],
      });
    });

    it('does not resolve external values', () => {
      var propTypeExpression = statement(`
        PropTypes.oneOf(TYPES);
        import { TYPES } from './foo';
      `).get('expression');

      expect(getPropType(propTypeExpression)).toEqual({
        name: 'enum',
        required: false,
        value: 'TYPES',
        computed: true,
      });
    });
  });

  it('detects custom validation functions', () => {
    expect(getPropType(expression('(function() {})'))).toEqual({
      name: 'custom',
      raw: '(function() {})',
    });

    expect(getPropType(expression('() => {}'))).toEqual({
      name: 'custom',
      raw: '() => {}',
    });
  });

  it('detects descriptions on nested types in shapes', () => {
    expect(getPropType(expression(`shape({
      /**
       * test1
       */
      foo: string,
      /**
       * test2
       */
      bar: bool
    })`)))
    .toEqual({
      name: 'shape',
      required: false,
      value: {
        foo: {
          name: 'string',
          description: 'test1',
          required: false,
        },
        bar: {
          name: 'bool',
          description: 'test2',
          required: false,
        },
      },
    });
  });

  it('detects required enums and shapes', () => {

    // Deep required
    expect(getPropType(expression(`shape({
      /**
       * test1
       */
      foo: string.isRequired,
      /**
       * test2
       */
      bar: bool
    })`)))
    .toEqual({
      name: 'shape',
      required: false,
      value: {
        foo: {
          name: 'string',
          description: 'test1',
          required: true,
        },
        bar: {
          name: 'bool',
          description: 'test2',
          required: false,
        },
      },
    });

    // Parent required
    expect(getPropType(expression(`shape({
      /**
       * test1
       */
      foo: string.isRequired,
      /**
       * test2
       */
      bar: bool
    }).isRequired`)))
    .toEqual({
      name: 'shape',
      required: true,
      value: {
        foo: {
          name: 'string',
          description: 'test1',
          required: true,
        },
        bar: {
          name: 'bool',
          description: 'test2',
          required: false,
        },
      },
    });

    // Enum required
    expect(getPropType(expression('oneOf(["foo", "bar"]).isRequired')))
    .toEqual({
      name: 'enum',
      required: true,
      value: [
        {value: '"foo"', computed: false},
        {value: '"bar"', computed: false},
      ],
    });
  });

  it('detects required notations of nested types in shapes', () => {
    expect(getPropType(expression(`shape({
      foo: string.isRequired,
      bar: bool
    })`)))
    .toEqual({
      name: 'shape',
      required: false,
      value: {
        foo: {
          name: 'string',
          required: true,
        },
        bar: {
          name: 'bool',
          required: false,
        },
      },
    });
  });

});
