/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getFlowType from '../getFlowType';
import {
  expression,
  statement,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';

describe('getFlowType', () => {
  const mockImporter = makeMockImporter({
    abc: statement(`
      export type abc = number;
    `).get('declaration'),

    def: statement(`
      export type def = boolean;
    `).get('declaration'),

    xyz: statement(`
      export type xyz = string;
    `).get('declaration'),

    maybe: statement(`
      export type maybe = ?string;
    `).get('declaration'),

    barbaz: statement(`
      export type barbaz = "bar" | "baz";
    `).get('declaration'),

    recTup: statement(`
      export type recTup = [abc, xyz];
      import abc from 'abc';
      import xyz from 'xyz';
    `).get('declaration'),

    MyType: statement(`
      export type MyType = { a: string, b: ?notImported };
    `).get('declaration'),

    MyGenericType: statement(`
      export type MyType<T> = { a: T, b: Array<T> };
    `).get('declaration'),

    fruits: statement(`
      export default {
        'apple': '🍎',
        'banana': '🍌',
      };
    `).get('declaration'),

    otherFruits: statement(`
      export type OtherFruits = { orange: string };
    `).get('declaration'),
  });

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
      expect(getFlowType(typePath, null, noopImporter)).toEqual({ name: type });
    });
  });

  it('detects literal types', () => {
    const literalTypes = ['"foo"', 1234, true];

    literalTypes.forEach(value => {
      const typePath = expression(`x: ${value}`)
        .get('typeAnnotation')
        .get('typeAnnotation');
      expect(getFlowType(typePath, null, noopImporter)).toEqual({
        name: 'literal',
        value: `${value}`,
      });
    });
  });

  it('detects external type', () => {
    const typePath = expression('x: xyz')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({ name: 'xyz' });
  });

  it('resolves an imported type', () => {
    const typePath = statement(`
      (x: xyz);
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'string',
    });
  });

  it('detects external nullable type', () => {
    const typePath = expression('x: ?xyz')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'xyz',
      nullable: true,
    });
  });

  it('resolves an imported nullable type', () => {
    const typePath = statement(`
      (x: ?xyz);
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'string',
      nullable: true,
    });
  });

  it('detects array type shorthand optional', () => {
    const typePath = expression('x: ?number[]')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'Array',
      elements: [{ name: 'number', nullable: true }],
      raw: '(?number)[]',
    });
  });

  it('detects array type shorthand', () => {
    const typePath = expression('x: number[]')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'number[]',
    });
  });

  it('detects array type', () => {
    const typePath = expression('x: Array<number>')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'Array<number>',
    });
  });

  it('resolves imported types used for arrays', () => {
    let typePath = statement(`
      (x: Array<xyz>);
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'Array',
      elements: [{ name: 'string' }],
      raw: 'Array<xyz>',
    });

    typePath = statement(`
      (x: xyz[]);
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'Array',
      elements: [{ name: 'string' }],
      raw: 'xyz[]',
    });

    typePath = statement(`
      (x: ?xyz[]);
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'Array',
      elements: [{ name: 'string' }],
      raw: 'xyz[]',
      nullable: true,
    });

    typePath = statement(`
      (x: (?xyz)[]);
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'Array',
      elements: [{ name: 'string', nullable: true }],
      raw: '(?xyz)[]',
    });
  });

  it('detects array type with multiple types', () => {
    const typePath = expression('x: Array<number, xyz>')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }, { name: 'xyz' }],
      raw: 'Array<number, xyz>',
    });
  });

  it('resolves array type with multiple imported types', () => {
    const typePath = statement(`
      (x: Array<abc, xyz>);
      import type { abc } from 'abc';
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }, { name: 'string' }],
      raw: 'Array<abc, xyz>',
    });
  });

  it('detects class type', () => {
    const typePath = expression('x: Class<Boolean>')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'Class',
      elements: [{ name: 'Boolean' }],
      raw: 'Class<Boolean>',
    });
  });

  it('resolves imported subtype for class type', () => {
    const typePath = statement(`
      (x: Class<xyz>);
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'Class',
      elements: [{ name: 'string' }],
      raw: 'Class<xyz>',
    });
  });

  it('detects function type with subtype', () => {
    const typePath = expression('x: Function<xyz>')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'Function',
      elements: [{ name: 'xyz' }],
      raw: 'Function<xyz>',
    });
  });

  it('resolves imported subtype for function type', () => {
    const typePath = statement(`
      (x: Function<xyz>);
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'Function',
      elements: [{ name: 'string' }],
      raw: 'Function<xyz>',
    });
  });

  it('detects object types', () => {
    const typePath = expression('x: { a: string, b?: xyz }')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

  it('resolves imported types used for objects', () => {
    const typePath = statement(`
      (x: { a: abc, b: ?xyz, c?: xyz, d: maybe, e?: maybe });
      import type { abc } from 'abc';
      import type { xyz } from 'xyz';
      import type { maybe } from 'maybe';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          { key: 'a', value: { name: 'number', required: true } },
          {
            key: 'b',
            value: { name: 'string', nullable: true, required: false },
          },
          {
            key: 'c',
            value: { name: 'string', nullable: true, required: false },
          },
          {
            key: 'd',
            value: { name: 'string', nullable: true, required: false },
          },
          {
            key: 'e',
            value: { name: 'string', nullable: true, required: false },
          },
        ],
      },
      raw: '{ a: abc, b: ?xyz, c?: xyz, d: maybe, e?: maybe }',
    });
  });

  it('detects union type', () => {
    const typePath = expression('x: string | xyz | "foo" | void')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

  it('resolves imported types within union type', () => {
    const typePath = statement(`
      (x: string | barbaz | "foo" | void);
      import type { barbaz } from 'barbaz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'union',
      elements: [
        { name: 'string' },
        {
          name: 'union',
          elements: [
            { name: 'literal', value: '"bar"' },
            { name: 'literal', value: '"baz"' },
          ],
          raw: '"bar" | "baz"',
        },
        { name: 'literal', value: '"foo"' },
        { name: 'void' },
      ],
      raw: 'string | barbaz | "foo" | void',
    });
  });

  it('detects intersection type', () => {
    const typePath = expression('x: string & xyz & "foo" & void')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

  it('resolves imported types within intersection type', () => {
    const typePath = statement(`
      (x: string & barbaz & "foo" & void);
      import type { barbaz } from 'barbaz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'intersection',
      elements: [
        { name: 'string' },
        {
          name: 'union',
          elements: [
            { name: 'literal', value: '"bar"' },
            { name: 'literal', value: '"baz"' },
          ],
          raw: '"bar" | "baz"',
        },
        { name: 'literal', value: '"foo"' },
        { name: 'void' },
      ],
      raw: 'string & barbaz & "foo" & void',
    });
  });

  it('detects function signature type', () => {
    const typePath = expression(
      'x: (p1: number, p2: ?string, ...rest: Array<string>) => boolean',
    )
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

  it('resolves function signature types with imported types', () => {
    let typePath = statement(`
      (x: (p1: abc, p2: ?xyz, ...rest: Array<xyz>) => def);
      import type { abc } from 'abc';
      import type { def } from 'def';
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
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
              elements: [{ name: 'string', nullable: true }],
              raw: 'Array<xyz>',
            },
          },
        ],
        return: { name: 'boolean' },
      },
      raw: '(p1: abc, p2: ?xyz, ...rest: Array<xyz>) => def',
    });

    typePath = statement(`
      (x: (abc, ?xyz) => def);
      import type { abc } from 'abc';
      import type { def } from 'def';
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [
          { name: '', type: { name: 'number' } },
          { name: '', type: { name: 'string', nullable: true } },
        ],
        return: { name: 'boolean' },
      },
      raw: '(abc, ?xyz) => def',
    });

    typePath = statement(`
      (x: xyz => def);
      import type { def } from 'def';
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [{ name: '', type: { name: 'string' } }],
        return: { name: 'boolean' },
      },
      raw: 'xyz => def',
    });

    typePath = statement(`
      (x: { (str: xyz): abc, token: def });
      import type { abc } from 'abc';
      import type { def } from 'def';
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        constructor: {
          name: 'signature',
          type: 'function',
          signature: {
            arguments: [{ name: 'str', type: { name: 'string' } }],
            return: { name: 'number' },
          },
          raw: '(str: xyz): abc',
        },
        properties: [
          { key: 'token', value: { name: 'boolean', required: true } },
        ],
      },
      raw: '{ (str: xyz): abc, token: def }',
    });
  });

  it('detects map signature', () => {
    const typePath = expression(
      'x: { [key: string]: number, [key: "xl"]: string, token: "a" | "b" }',
    )
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

  it('resolves imported types in map signature', () => {
    const typePath = statement(`
      (x: { [key: xyz]: abc, [key: "xl"]: def, token: barbaz });
      import type { abc } from 'abc';
      import type { def } from 'def';
      import type { xyz } from 'xyz';
      import type { barbaz } from 'barbaz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');
    expect(getFlowType(typePath, null, mockImporter)).toEqual({
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
            value: { name: 'boolean', required: true },
          },
          {
            key: 'token',
            value: {
              name: 'union',
              required: true,
              raw: '"bar" | "baz"',
              elements: [
                { name: 'literal', value: '"bar"' },
                { name: 'literal', value: '"baz"' },
              ],
            },
          },
        ],
      },
      raw: '{ [key: xyz]: abc, [key: "xl"]: def, token: barbaz }',
    });
  });

  it('detects tuple signature', () => {
    const typePath = expression('x: [string, number]')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'tuple',
      elements: [{ name: 'string' }, { name: 'number' }],
      raw: '[string, number]',
    });
  });

  it('detects tuple in union signature', () => {
    const typePath = expression('x: [string, number] | [number, string]')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

  it('resolves imported types used in tuple signature', () => {
    let typePath = statement(`
      (x: [xyz, abc]);
      import type { abc } from 'abc';
      import type { xyz } from 'xyz';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'tuple',
      elements: [{ name: 'string' }, { name: 'number' }],
      raw: '[xyz, abc]',
    });

    typePath = statement(`
      (x: [xyz, abc] | recTup);
      import type { abc } from 'abc';
      import type { xyz } from 'xyz';
      import type { recTup } from 'recTup';
    `).get('expression', 'typeAnnotation', 'typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'union',
      elements: [
        {
          name: 'tuple',
          elements: [{ name: 'string' }, { name: 'number' }],
          raw: '[xyz, abc]',
        },
        {
          name: 'tuple',
          elements: [{ name: 'number' }, { name: 'string' }],
          raw: '[abc, xyz]',
        },
      ],
      raw: '[xyz, abc] | recTup',
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'string',
    });
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

  it('resolves typeof of imported types', () => {
    const typePath = statement(`
      var x: typeof MyType = {};
      import type { MyType } from 'MyType';
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          { key: 'a', value: { name: 'string', required: true } },
          {
            key: 'b',
            value: { name: 'notImported', nullable: true, required: true },
          },
        ],
      },
      raw: '{ a: string, b: ?notImported }',
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

  it('resolves imported types that need subtypes', () => {
    const typePath = statement(`
      var x: MyGenericType<string> = {};
      import type { MyGenericType } from 'MyGenericType';
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
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

      expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: 'apple' },
        { name: 'literal', value: 'banana' },
        { name: 'literal', value: 'orange' },
      ],
      raw: '$Keys<{| apple: string, banana: string, ...OtherFruits |}>',
    });
  });

  it('resolves $Keys to imported types', () => {
    let typePath = statement(`
      var x: $Keys<typeof CONTENTS> = 2;
      import CONTENTS from 'fruits';
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: '$Keys<typeof CONTENTS>',
    });

    typePath = statement(`
      var x: $Keys<CONTENTS> = 2;
      import CONTENTS from 'fruits';
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: '$Keys<CONTENTS>',
    });

    typePath = statement(`
      var x: $Keys<{| apple: string, banana: string, ...OtherFruits |}> = 2;
      import type { OtherFruits } from 'otherFruits';
    `)
      .get('declarations', 0)
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath, null, mockImporter)).toEqual({
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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

    expect(getFlowType(typePath, null, noopImporter)).toEqual({
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
