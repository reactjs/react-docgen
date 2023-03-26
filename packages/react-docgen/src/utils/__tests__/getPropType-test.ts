import type { ExpressionStatement } from '@babel/types';
import { parse, makeMockImporter } from '../../../tests/utils';
import getPropType from '../getPropType.js';
import { describe, expect, test } from 'vitest';
import type { NodePath } from '@babel/traverse';

describe('getPropType', () => {
  test('detects simple prop types', () => {
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

    simplePropTypes.forEach((type) =>
      expect(getPropType(parse.expression('React.PropTypes.' + type))).toEqual({
        name: type,
      }),
    );

    // It doesn't actually matter what the MemberExpression is
    simplePropTypes.forEach((type) =>
      expect(getPropType(parse.expression('Foo.' + type + '.bar'))).toEqual({
        name: type,
      }),
    );

    // Doesn't even have to be a MemberExpression
    simplePropTypes.forEach((type) =>
      expect(getPropType(parse.expression(type))).toEqual({
        name: type,
      }),
    );
  });

  test('detects complex prop types', () => {
    expect(getPropType(parse.expression('oneOf(["foo", "bar"])'))).toEqual({
      name: 'enum',
      value: [
        { value: '"foo"', computed: false },
        { value: '"bar"', computed: false },
      ],
    });

    // line comments are ignored
    expect(
      getPropType(parse.expression('oneOf(["foo", // baz\n"bar"])')),
    ).toEqual({
      name: 'enum',
      value: [
        { value: '"foo"', computed: false },
        { value: '"bar"', computed: false },
      ],
    });

    expect(getPropType(parse.expression('oneOfType([number, bool])'))).toEqual({
      name: 'union',
      value: [{ name: 'number' }, { name: 'bool' }],
    });

    // custom type
    expect(getPropType(parse.expression('oneOfType([foo])'))).toEqual({
      name: 'union',
      value: [{ name: 'custom', raw: 'foo' }],
    });

    expect(getPropType(parse.expression('instanceOf(Foo)'))).toEqual({
      name: 'instanceOf',
      value: 'Foo',
    });

    expect(getPropType(parse.expression('arrayOf(string)'))).toEqual({
      name: 'arrayOf',
      value: { name: 'string' },
    });

    expect(getPropType(parse.expression('objectOf(string)'))).toEqual({
      name: 'objectOf',
      value: { name: 'string' },
    });

    expect(
      getPropType(parse.expression('shape({foo: string, bar: bool})')),
    ).toEqual({
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

    expect(
      getPropType(parse.expression('exact({foo: string, bar: bool})')),
    ).toEqual({
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
    expect(getPropType(parse.expression('shape({foo: xyz})'))).toEqual({
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
    expect(getPropType(parse.expression('exact({foo: xyz})'))).toEqual({
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
    expect(getPropType(parse.expression('shape(Child.propTypes)'))).toEqual({
      name: 'shape',
      value: 'Child.propTypes',
      computed: true,
    });

    // computed
    expect(getPropType(parse.expression('exact(Child.propTypes)'))).toEqual({
      name: 'exact',
      value: 'Child.propTypes',
      computed: true,
    });
  });

  describe('resolve identifier to their values', () => {
    const mockImporter = makeMockImporter({
      shape: (stmt) =>
        stmt(`
        export default {bar: PropTypes.string};
      `).get('declaration'),

      types: (stmt) =>
        stmt(`
        export default ["foo", "bar"];
      `).get('declaration'),

      foo: (stmt) =>
        stmt(`
        export default "foo";
      `).get('declaration'),

      bar: (stmt) =>
        stmt(`
        export default "bar";
      `).get('declaration'),

      obj: (stmt) =>
        stmt(`
        export default { FOO: "foo", BAR: "bar" };
      `).get('declaration'),

      arr: (stmt) =>
        stmt(`
        export default ["foo", "bar"];
      `).get('declaration'),

      keys: (stmt) =>
        stmt(`
        import obj from 'obj';
        export default Object.keys(obj);
      `).get('declaration'),

      values: (stmt) =>
        stmt(`
        import obj from 'obj';
        export default Object.values(obj);
      `).get('declaration'),
    });

    test('resolves variables to their values', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.shape(shape);
        var shape = {bar: PropTypes.string};
      `,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('resolves imported variables to their values', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.shape(shape);
        import shape from 'shape';
      `,
          mockImporter,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('resolves simple identifier to their initialization value', () => {
      const propTypeIdentifier = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf(TYPES);
        var TYPES = ["foo", "bar"];
      `,
        )
        .get('expression');

      expect(getPropType(propTypeIdentifier)).toMatchSnapshot();
    });

    test('resolves importer identifier to initialization value', () => {
      const propTypeIdentifier = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf(TYPES);
        import TYPES from 'types';
      `,
          mockImporter,
        )
        .get('expression');

      expect(getPropType(propTypeIdentifier)).toMatchSnapshot();
    });

    test('resolves simple identifier to their initialization value in array', () => {
      const identifierInsideArray = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf([FOO, BAR]);
        var FOO = "foo";
        var BAR = "bar";
      `,
        )
        .get('expression');

      expect(getPropType(identifierInsideArray)).toMatchSnapshot();
    });

    test('resolves imported identifier to their initialization value in array', () => {
      const identifierInsideArray = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf([FOO, BAR]);
        import FOO from 'foo';
        import BAR from 'bar';
      `,
          mockImporter,
        )
        .get('expression');

      expect(getPropType(identifierInsideArray)).toMatchSnapshot();
    });

    test('handles unresolved imported identifier to their initialization value in array', () => {
      const identifierInsideArray = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf([FOO, BAR]);
        import FOO from 'foo';
        import BAR from 'bar';
      `,
        )
        .get('expression');

      expect(getPropType(identifierInsideArray)).toMatchSnapshot();
    });

    test('handles unresolved named imported identifier to their initialization value in array', () => {
      const identifierInsideArray = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf([FOO, BAR]);
        import { FOO } from 'foo';
        import { BAR } from 'bar';
      `,
        )
        .get('expression');

      expect(getPropType(identifierInsideArray)).toMatchSnapshot();
    });

    test('resolves memberExpressions', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf([TYPES.FOO, TYPES.BAR]);
        var TYPES = { FOO: "foo", BAR: "bar" };
      `,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('resolves memberExpressions from imported objects', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf([TYPES.FOO, TYPES.BAR]);
        import TYPES from 'obj';
      `,
          mockImporter,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('correctly resolves SpreadElements in arrays', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf([...TYPES]);
        var TYPES = ["foo", "bar"];
      `,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('correctly resolves SpreadElements in arrays from imported values', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf([...TYPES]);
        import TYPES from 'arr';
      `,
          mockImporter,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('correctly resolves nested SpreadElements in arrays', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf([...TYPES]);
        var TYPES = ["foo", ...TYPES2];
        var TYPES2 = ["bar"];
      `,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('does resolve object keys values', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf(Object.keys(TYPES));
        var TYPES = { FOO: "foo", BAR: "bar" };
      `,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('resolves values from imported Object.keys call', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf(keys);
        import keys from 'keys';
      `,
          mockImporter,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('does resolve object values', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf(Object.values(TYPES));
        var TYPES = { FOO: "foo", BAR: "bar" };
      `,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('resolves values from imported Object.values call', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf(values);
        import values from 'values';
      `,
          mockImporter,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('resolves value constants from imported objects', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        const values = {
          FOO: consts.FOO, BAR: consts.BAR
        }
        PropTypes.oneOf(Object.values(values));
        import consts from 'obj';
      `,
          mockImporter,
          1,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('handles unresolved value constants from imported objects', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        const values = {
          FOO: consts.FOO, BAR: consts.BAR
        }
        PropTypes.oneOf(Object.values(values));
        import consts from 'obj';
      `,
          1,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });

    test('does not resolve external values without proper importer', () => {
      const propTypeExpression = parse
        .statement<ExpressionStatement>(
          `
        PropTypes.oneOf(TYPES);
        import { TYPES } from './foo.js';
      `,
        )
        .get('expression');

      expect(getPropType(propTypeExpression)).toMatchSnapshot();
    });
  });

  test('detects custom validation functions for function', () => {
    expect(getPropType(parse.expression('(function() {})'))).toMatchSnapshot();
  });

  test('detects custom validation functions for arrow function', () => {
    expect(getPropType(parse.expression('() => {}'))).toMatchSnapshot();
  });

  test('detects descriptions on nested types in arrayOf', () => {
    expect(
      getPropType(
        parse.expression(`arrayOf(
      /**
       * test2
       */
      string
    )`),
      ),
    ).toMatchSnapshot();
  });

  test('detects descriptions on nested types in objectOf', () => {
    expect(
      getPropType(
        parse.expression(`objectOf(
      /**
       * test2
       */
      string
    )`),
      ),
    ).toMatchSnapshot();
  });

  test('detects descriptions on nested types in shapes', () => {
    expect(
      getPropType(
        parse.expression(`shape({
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

  test('detects required notations of nested types in shapes', () => {
    expect(
      getPropType(
        parse.expression(`shape({
      foo: string.isRequired,
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });

  test('detects descriptions on nested types in exacts', () => {
    expect(
      getPropType(
        parse.expression(`exact({
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

  test('detects required notations of nested types in exacts', () => {
    expect(
      getPropType(
        parse.expression(`exact({
      foo: string.isRequired,
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });

  test('handles computed properties', () => {
    expect(
      getPropType(
        parse.expression(`exact({
      [foo]: string.isRequired,
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });

  test('ignores complex computed properties', () => {
    expect(
      getPropType(
        parse.expression(`exact({
      [() => {}]: string.isRequired,
      bar: bool
    })`),
      ),
    ).toMatchSnapshot();
  });

  test('works with cyclic references in shape', () => {
    expect(
      getPropType(
        parse
          .statementLast<ExpressionStatement>(
            `const Component = () => {}
             Component.propTypes = {
               foo: shape(Component.propTypes)
             }`,
          )
          .get('expression.right.properties.0.value') as NodePath,
      ),
    ).toMatchSnapshot();
  });

  test('works with cyclic references in shape and required', () => {
    expect(
      getPropType(
        parse
          .statementLast<ExpressionStatement>(
            `const Component = () => {}
             Component.propTypes = {
               foo: shape(Component.propTypes).isRequired
             }`,
          )
          .get('expression.right.properties.0.value') as NodePath,
      ),
    ).toMatchSnapshot();
  });

  test('works with missing argument', () => {
    expect(
      getPropType(
        parse
          .statementLast<ExpressionStatement>(
            `const Component = () => {}
             const MyShape = { foo: shape() }
             Component.propTypes = {
               foo: shape(MyShape)
             }`,
          )
          .get('expression.right.properties.0.value') as NodePath,
      ),
    ).toMatchSnapshot();
  });
});
