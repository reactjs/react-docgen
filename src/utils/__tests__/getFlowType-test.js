/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getFlowType from '../getFlowType';
import { expression, statement } from '../../../tests/utils';

describe('getFlowType', () => {
  it('detects simple types', () => {
    const simplePropTypes = [
      'string',
      'number',
      'boolean',
      'any',
      'mixed',
      'null',
      'void',
      'empty',
      'Object',
      'Function',
      'Boolean',
      'String',
      'Number',
    ];

    simplePropTypes.forEach(type => {
      const typePath = expression('x: ' + type)
        .get('typeAnnotation')
        .get('typeAnnotation');
      expect(getFlowType(typePath)).toEqual({ name: type });
    });
  });

  it('detects literal types', () => {
    const literalTypes = ['"foo"', 1234, true];

    literalTypes.forEach(value => {
      const typePath = expression(`x: ${value}`)
        .get('typeAnnotation')
        .get('typeAnnotation');
      expect(getFlowType(typePath)).toEqual({
        name: 'literal',
        value: `${value}`,
      });
    });
  });

  it('detects external type', () => {
    const typePath = expression('x: xyz')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({ name: 'xyz' });
  });

  it('detects external nullable type', () => {
    const typePath = expression('x: ?xyz')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({ name: 'xyz', nullable: true });
  });

  it('detects array type shorthand optional', () => {
    const typePath = expression('x: ?number[]')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'number[]',
      nullable: true,
    });
  });

  it('detects array type shorthand optional type', () => {
    const typePath = expression('x: (?number)[]')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number', nullable: true }],
      raw: '(?number)[]',
    });
  });

  it('detects array type shorthand', () => {
    const typePath = expression('x: number[]')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'number[]',
    });
  });

  it('detects array type', () => {
    const typePath = expression('x: Array<number>')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'Array<number>',
    });
  });

  it('detects array type with multiple types', () => {
    const typePath = expression('x: Array<number, xyz>')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }, { name: 'xyz' }],
      raw: 'Array<number, xyz>',
    });
  });

  it('detects class type', () => {
    const typePath = expression('x: Class<Boolean>')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Class',
      elements: [{ name: 'Boolean' }],
      raw: 'Class<Boolean>',
    });
  });

  it('detects function type with subtype', () => {
    const typePath = expression('x: Function<xyz>')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Function',
      elements: [{ name: 'xyz' }],
      raw: 'Function<xyz>',
    });
  });

  it('detects object types', () => {
    const typePath = expression('x: { a: string, b?: xyz }')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          { key: 'a', value: { name: 'string', required: true } },
          { key: 'b', value: { name: 'xyz', required: false } },
        ],
      },
      raw: '{ a: string, b?: xyz }',
    });
  });

  it('detects object types with maybe type', () => {
    const typePath = expression('x: { a: string, b: ?xyz }')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          { key: 'a', value: { name: 'string', required: true } },
          { key: 'b', value: { name: 'xyz', nullable: true, required: true } },
        ],
      },
      raw: '{ a: string, b: ?xyz }',
    });
  });

  it('detects union type', () => {
    const typePath = expression('x: string | xyz | "foo" | void')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'string' },
        { name: 'xyz' },
        { name: 'literal', value: '"foo"' },
        { name: 'void' },
      ],
      raw: 'string | xyz | "foo" | void',
    });
  });

  it('detects intersection type', () => {
    const typePath = expression('x: string & xyz & "foo" & void')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'intersection',
      elements: [
        { name: 'string' },
        { name: 'xyz' },
        { name: 'literal', value: '"foo"' },
        { name: 'void' },
      ],
      raw: 'string & xyz & "foo" & void',
    });
  });

  it('detects function signature type', () => {
    const typePath = expression(
      'x: (p1: number, p2: ?string, ...rest: Array<string>) => boolean',
    )
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [
          { name: 'p1', type: { name: 'number' } },
          { name: 'p2', type: { name: 'string', nullable: true } },
          {
            name: 'rest',
            rest: true,
            type: {
              name: 'Array',
              elements: [{ name: 'string' }],
              raw: 'Array<string>',
            },
          },
        ],
        return: { name: 'boolean' },
      },
      raw: '(p1: number, p2: ?string, ...rest: Array<string>) => boolean',
    });
  });

  it('detects function signature types without parameter names', () => {
    const typePath = expression('x: (number, ?string) => boolean')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [
          { name: '', type: { name: 'number' } },
          { name: '', type: { name: 'string', nullable: true } },
        ],
        return: { name: 'boolean' },
      },
      raw: '(number, ?string) => boolean',
    });
  });

  it('detects function signature type with single parmeter without name', () => {
    const typePath = expression('x: string => boolean')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [{ name: '', type: { name: 'string' } }],
        return: { name: 'boolean' },
      },
      raw: 'string => boolean',
    });
  });

  it('detects callable signature type', () => {
    const typePath = expression('x: { (str: string): string, token: string }')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        constructor: {
          name: 'signature',
          type: 'function',
          signature: {
            arguments: [{ name: 'str', type: { name: 'string' } }],
            return: { name: 'string' },
          },
          raw: '(str: string): string',
        },
        properties: [
          { key: 'token', value: { name: 'string', required: true } },
        ],
      },
      raw: '{ (str: string): string, token: string }',
    });
  });

  it('detects map signature', () => {
    const typePath = expression(
      'x: { [key: string]: number, [key: "xl"]: string, token: "a" | "b" }',
    )
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          {
            key: { name: 'string' },
            value: { name: 'number', required: true },
          },
          {
            key: { name: 'literal', value: '"xl"' },
            value: { name: 'string', required: true },
          },
          {
            key: 'token',
            value: {
              name: 'union',
              required: true,
              raw: '"a" | "b"',
              elements: [
                { name: 'literal', value: '"a"' },
                { name: 'literal', value: '"b"' },
              ],
            },
          },
        ],
      },
      raw: '{ [key: string]: number, [key: "xl"]: string, token: "a" | "b" }',
    });
  });

  it('detects tuple signature', () => {
    const typePath = expression('x: [string, number]')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'tuple',
      elements: [{ name: 'string' }, { name: 'number' }],
      raw: '[string, number]',
    });
  });

  it('detects tuple in union signature', () => {
    const typePath = expression('x: [string, number] | [number, string]')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        {
          name: 'tuple',
          elements: [{ name: 'string' }, { name: 'number' }],
          raw: '[string, number]',
        },
        {
          name: 'tuple',
          elements: [{ name: 'number' }, { name: 'string' }],
          raw: '[number, string]',
        },
      ],
      raw: '[string, number] | [number, string]',
    });
  });

  it('resolves types in scope', () => {
    const typePath = statement(`
      var x: MyType = 2;

      type MyType = string;
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({ name: 'string' });
  });

  it('handles typeof types', () => {
    const typePath = statement(`
      var x: typeof MyType = {};

      type MyType = { a: string, b: ?xyz };
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          { key: 'a', value: { name: 'string', required: true } },
          { key: 'b', value: { name: 'xyz', nullable: true, required: true } },
        ],
      },
      raw: '{ a: string, b: ?xyz }',
    });
  });

  it('handles qualified type identifiers', () => {
    const typePath = statement(`
      var x: MyType.x = {};

      type MyType = { a: string, b: ?xyz };
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'MyType.x',
    });
  });

  it('handles qualified type identifiers with params', () => {
    const typePath = statement(`
      var x: MyType.x<any> = {};

      type MyType = { a: string, b: ?xyz };
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'MyType.x',
      raw: 'MyType.x<any>',
      elements: [
        {
          name: 'any',
        },
      ],
    });
  });

  it('handles generic types', () => {
    const typePath = statement(`
      var x: MyType<string> = {};

      type MyType<T> = { a: T, b: Array<T> };
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      raw: '{ a: T, b: Array<T> }',
      signature: {
        properties: [
          {
            key: 'a',
            value: {
              name: 'string',
              required: true,
            },
          },
          {
            key: 'b',
            value: {
              name: 'Array',
              raw: 'Array<T>',
              required: true,
              elements: [{ name: 'string' }],
            },
          },
        ],
      },
    });
  });

  describe('React types', () => {
    function test(type, expected) {
      const typePath = statement(`
        var x: ${type} = 2;

        type Props = { x: string };
      `)
        .get('declarations', 0)
        .get('id')
        .get('typeAnnotation')
        .get('typeAnnotation');

      expect(getFlowType(typePath)).toEqual({
        ...expected,
        name: type.replace('.', '').replace(/<.+>/, ''),
        raw: type,
      });
    }

    const types = {
      'React.Node': {},
      'React.Key': {},
      'React.ElementType': {},
      'React.ChildrenArray<string>': { elements: [{ name: 'string' }] },
      'React.Element<any>': { elements: [{ name: 'any' }] },
      'React.Ref<typeof Component>': { elements: [{ name: 'Component' }] },
      'React.ElementProps<Component>': { elements: [{ name: 'Component' }] },
      'React.ElementRef<Component>': { elements: [{ name: 'Component' }] },
      'React.ComponentType<Props>': {
        elements: [
          {
            name: 'signature',
            raw: '{ x: string }',
            signature: {
              properties: [
                { key: 'x', value: { name: 'string', required: true } },
              ],
            },
            type: 'object',
          },
        ],
      },
      'React.StatelessFunctionalComponent<Props2>': {
        elements: [{ name: 'Props2' }],
      },
    };

    Object.keys(types).forEach(type => {
      it(type, () => test(type, types[type]));
    });
  });

  it('resolves $Keys to union', () => {
    const typePath = statement(`
      var x: $Keys<typeof CONTENTS> = 2;
      const CONTENTS = {
        'apple': '🍎',
        'banana': '🍌',
      };
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: '$Keys<typeof CONTENTS>',
    });
  });

  it('resolves $Keys without typeof to union', () => {
    const typePath = statement(`
      var x: $Keys<CONTENTS> = 2;
      const CONTENTS = {
        'apple': '🍎',
        'banana': '🍌',
      };
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: '$Keys<CONTENTS>',
    });
  });

  it('resolves $Keys with an ObjectTypeAnnotation typeParameter to union', () => {
    const typePath = statement(`
      var x: $Keys<{| apple: string, banana: string |}> = 2;
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: 'apple' },
        { name: 'literal', value: 'banana' },
      ],
      raw: '$Keys<{| apple: string, banana: string |}>',
    });
  });

  it('resolves $Keys with an ObjectTypeAnnotation typeParameter to union with an ObjectTypeSpreadProperty', () => {
    const typePath = statement(`
      var x: $Keys<{| apple: string, banana: string, ...OtherFruits |}> = 2;
      type OtherFruits = { orange: string }
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: 'apple' },
        { name: 'literal', value: 'banana' },
        { name: 'literal', value: 'orange' },
      ],
      raw: '$Keys<{| apple: string, banana: string, ...OtherFruits |}>',
    });
  });

  it('handles multiple references to one type', () => {
    const typePath = statement(`
      let action: { a: Action, b: Action };
      type Action = {};
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          {
            key: 'a',
            value: {
              name: 'signature',
              type: 'object',
              required: true,
              raw: '{}',
              signature: { properties: [] },
            },
          },
          {
            key: 'b',
            value: {
              name: 'signature',
              type: 'object',
              required: true,
              raw: '{}',
              signature: { properties: [] },
            },
          },
        ],
      },
      raw: '{ a: Action, b: Action }',
    });
  });

  it('handles self-referencing type cycles', () => {
    const typePath = statement(`
      let action: Action;
      type Action = { subAction: Action };
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          { key: 'subAction', value: { name: 'Action', required: true } },
        ],
      },
      raw: '{ subAction: Action }',
    });
  });

  it('handles long type cycles', () => {
    const typePath = statement(`
      let action: Action;
      type Action = { subAction: SubAction };
      type SubAction = { subAction: SubSubAction };
      type SubSubAction = { subAction: SubSubSubAction };
      type SubSubSubAction = { rootAction: Action };
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          {
            key: 'subAction',
            value: {
              name: 'signature',
              type: 'object',
              required: true,
              signature: {
                properties: [
                  {
                    key: 'subAction',
                    value: {
                      name: 'signature',
                      type: 'object',
                      required: true,
                      signature: {
                        properties: [
                          {
                            key: 'subAction',
                            value: {
                              name: 'signature',
                              type: 'object',
                              required: true,
                              signature: {
                                properties: [
                                  {
                                    key: 'rootAction',
                                    value: { name: 'Action', required: true },
                                  },
                                ],
                              },
                              raw: '{ rootAction: Action }',
                            },
                          },
                        ],
                      },
                      raw: '{ subAction: SubSubSubAction }',
                    },
                  },
                ],
              },
              raw: '{ subAction: SubSubAction }',
            },
          },
        ],
      },
      raw: '{ subAction: SubAction }',
    });
  });
});
