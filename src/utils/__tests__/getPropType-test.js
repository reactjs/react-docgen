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
      value: [
        {value: '"foo"', computed: false},
        {value: '"bar"', computed: false},
      ],
    });

    // line comments are ignored
    expect(getPropType(expression('oneOf(["foo", // baz\n"bar"])'))).toEqual({
      name: 'enum',
      value: [
        {value: '"foo"', computed: false},
        {value: '"bar"', computed: false},
      ],
    });

    expect(getPropType(expression('oneOfType([number, bool])'))).toEqual({
      name: 'union',
      value: [
        {name: 'number'},
        {name: 'bool'},
      ],
    });

    // custom type
    expect(getPropType(expression('oneOfType([foo])'))).toEqual({
      name: 'union',
      value: [{name: 'custom', raw: 'foo'}],
    });

    // custom type
    expect(getPropType(expression('instanceOf(Foo)'))).toEqual({
      name: 'instanceOf',
      value: 'Foo',
    });

    expect(getPropType(expression('arrayOf(string)'))).toEqual({
      name: 'arrayOf',
      value: {name: 'string'},
    });

    expect(getPropType(expression('shape({foo: string, bar: bool})'))).toEqual({
      name: 'shape',
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
      value: {
        foo: {
          name: 'custom',
          raw: 'xyz',
          required: false,
        },
      },
    });
  });

  it('resolves variables to their values', () => {
    var propTypeExpression = statement(`
      PropTypes.shape(shape);
      var shape = {bar: PropTypes.string};
    `).get('expression');

    expect(getPropType(propTypeExpression)).toEqual({
      name: 'shape',
      value: {
        bar: {
          name: 'string',
          required: false,
        },
      },
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

  it('detects required notations of nested types in shapes', () => {
    expect(getPropType(expression(`shape({
      foo: string.isRequired,
      bar: bool
    })`)))
    .toEqual({
      name: 'shape',
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
