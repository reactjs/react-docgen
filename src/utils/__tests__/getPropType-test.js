/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expression, statement } from '../../../tests/utils';
import getPropType from '../getPropType';

describe('getPropType', () => {
  it('detects simple prop types', () => {
    const simplePropTypes = [
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
      'elementType',
    ];

    simplePropTypes.forEach(type =>
      expect(getPropType(expression('React.PropTypes.' + type))).toEqual({
        name: type,
      }),
    );

    // It doesn't actually matter what the MemberExpression is
    simplePropTypes.forEach(type =>
      expect(getPropType(expression('Foo.' + type + '.bar'))).toEqual({
        name: type,
      }),
    );

    // Doesn't even have to be a MemberExpression
    simplePropTypes.forEach(type =>
      expect(getPropType(expression(type))).toEqual({ name: type }),
    );
  });

  it('detects complex prop types', () => {
    expect(getPropType(expression('oneOf(["foo", "bar"])'))).toEqual({
      name: 'enum',
      value: [
        { value: '"foo"', computed: false },
        { value: '"bar"', computed: false },
      ],
    });

    // line comments are ignored
    expect(getPropType(expression('oneOf(["foo", // baz\n"bar"])'))).toEqual({
      name: 'enum',
      value: [
        { value: '"foo"', computed: false },
        { value: '"bar"', computed: false },
      ],
    });

    expect(getPropType(expression('oneOfType([number, bool])'))).toEqual({
      name: 'union',
      value: [{ name: 'number' }, { name: 'bool' }],
    });

    // custom type
    expect(getPropType(expression('oneOfType([foo])'))).toEqual({
      name: 'union',
      value: [{ name: 'custom', raw: 'foo' }],
    });

    expect(getPropType(expression('instanceOf(Foo)'))).toEqual({
      name: 'instanceOf',
      value: 'Foo',
    });

    expect(getPropType(expression('arrayOf(string)'))).toEqual({
      name: 'arrayOf',
      value: { name: 'string' },
    });

    expect(getPropType(expression('objectOf(string)'))).toEqual({
      name: 'objectOf',
      value: { name: 'string' },
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

    expect(getPropType(expression('exact({foo: string, bar: bool})'))).toEqual({
      name: 'exact',
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

    // custom
    expect(getPropType(expression('exact({foo: xyz})'))).toEqual({
      name: 'exact',
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
      value: 'Child.propTypes',
      computed: true,
    });

    // computed
    expect(getPropType(expression('exact(Child.propTypes)'))).toEqual({
      name: 'exact',
      value: 'Child.propTypes',
      computed: true,
    });
  });

  describe('resolve identifier to their values', () => {
    it('resolves variables to their values', () => {
      const propTypeExpression = statement(`
        PropTypes.shape(shape);
        var shape = {bar: PropTypes.string};
      `).get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    it('resolves simple identifier to their initialization value', () => {
      const propTypeIdentifier = statement(`
        PropTypes.oneOf(TYPES);
        var TYPES = ["foo", "bar"];
      `).get('expression');

      expect(getPropType(propTypeIdentifier)).toMatchSnapshot();
    });

    it('resolves simple identifier to their initialization value in array', () => {
      const identifierInsideArray = statement(`
        PropTypes.oneOf([FOO, BAR]);
        var FOO = "foo";
        var BAR = "bar";
      `).get('expression');

      expect(getPropType(identifierInsideArray)).toMatchSnapshot();
    });

    it('resolves memberExpressions', () => {
      const propTypeExpression = statement(`
        PropTypes.oneOf([TYPES.FOO, TYPES.BAR]);
        var TYPES = { FOO: "foo", BAR: "bar" };
      `).get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    it('correctly resolves SpreadElements in arrays', () => {
      const propTypeExpression = statement(`
        PropTypes.oneOf([...TYPES]);
        var TYPES = ["foo", "bar"];
      `).get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    it('correctly resolves nested SpreadElements in arrays', () => {
      const propTypeExpression = statement(`
        PropTypes.oneOf([...TYPES]);
        var TYPES = ["foo", ...TYPES2];
        var TYPES2 = ["bar"];
      `).get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    it('does resolve object keys values', () => {
      const propTypeExpression = statement(`
        PropTypes.oneOf(Object.keys(TYPES));
        var TYPES = { FOO: "foo", BAR: "bar" };
      `).get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    it('does resolve object values', () => {
      const propTypeExpression = statement(`
        PropTypes.oneOf(Object.values(TYPES));
        var TYPES = { FOO: "foo", BAR: "bar" };
      `).get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    it('does not resolve external values', () => {
      const propTypeExpression = statement(`
        PropTypes.oneOf(TYPES);
        import { TYPES } from './foo';
      `).get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });
  });

  it('detects custom validation functions for function', () => {
    expect(getPropType(expression('(function() {})'))).toMatchSnapshot();
  });

  it('detects custom validation functions for arrow function', () => {
    expect(getPropType(expression('() => {}'))).toMatchSnapshot();
  });

  it('detects descriptions on nested types in arrayOf', () => {
    expect(
      getPropType(
        expression(`arrayOf(
      /**
       * test2
       */
      string
    )`),
      ),
    ).toMatchSnapshot();
  });

  it('detects descriptions on nested types in objectOf', () => {
    expect(
      getPropType(
        expression(`objectOf(
      /**
       * test2
       */
      string
    )`),
      ),
    ).toMatchSnapshot();
  });

  it('detects descriptions on nested types in shapes', () => {
    expect(
      getPropType(
        expression(`shape({
      /**
       * test1
       */
      foo: string,
      /**
       * test2
       */
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });

  it('detects required notations of nested types in shapes', () => {
    expect(
      getPropType(
        expression(`shape({
      foo: string.isRequired,
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });

  it('detects descriptions on nested types in exacts', () => {
    expect(
      getPropType(
        expression(`exact({
      /**
       * test1
       */
      foo: string,
      /**
       * test2
       */
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });

  it('detects required notations of nested types in exacts', () => {
    expect(
      getPropType(
        expression(`exact({
      foo: string.isRequired,
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });

  it('handles computed properties', () => {
    expect(
      getPropType(
        expression(`exact({
      [foo]: string.isRequired,
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });

  it('ignores complex computed properties', () => {
    expect(
      getPropType(
        expression(`exact({
      [() => {}]: string.isRequired,
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });
});
