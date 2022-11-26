import getFlowType from '../getFlowType.js';
import { parse, makeMockImporter } from '../../../tests/utils';
import type {
  ExportNamedDeclaration,
  ExpressionStatement,
  FlowType,
  Identifier,
  TypeAlias,
  TypeCastExpression,
  VariableDeclaration,
} from '@babel/types';
import type { NodePath } from '@babel/traverse';
import { describe, expect, test } from 'vitest';

describe('getFlowType', () => {
  const mockImporter = makeMockImporter({
    abc: stmt =>
      stmt<ExportNamedDeclaration>(`
      export type abc = number;
    `).get('declaration') as NodePath<TypeAlias>,

    def: stmt =>
      stmt<ExportNamedDeclaration>(`
      export type def = boolean;
    `).get('declaration') as NodePath<TypeAlias>,

    xyz: stmt =>
      stmt<ExportNamedDeclaration>(`
      export type xyz = string;
    `).get('declaration') as NodePath<TypeAlias>,

    maybe: stmt =>
      stmt<ExportNamedDeclaration>(`
      export type maybe = ?string;
    `).get('declaration') as NodePath<TypeAlias>,

    barbaz: stmt =>
      stmt<ExportNamedDeclaration>(`
      export type barbaz = "bar" | "baz";
    `).get('declaration') as NodePath<TypeAlias>,

    recTup: stmt =>
      stmt<ExportNamedDeclaration>(`
      import type { abc } from 'abc';
      import type { xyz } from 'xyz';
      export type recTup = [abc, xyz];
    `).get('declaration') as NodePath<TypeAlias>,

    MyType: stmt =>
      stmt<ExportNamedDeclaration>(`
      export type MyType = { a: string, b: ?notImported };
    `).get('declaration') as NodePath<TypeAlias>,

    MyGenericType: stmt =>
      stmt<ExportNamedDeclaration>(`
      export type MyType<T> = { a: T, b: Array<T> };
    `).get('declaration') as NodePath<TypeAlias>,

    fruits: stmt =>
      stmt(`
      export default {
        'apple': '🍎',
        'banana': '🍌',
      };
    `).get('declaration'),

    otherFruits: stmt =>
      stmt<ExportNamedDeclaration>(`
      export type OtherFruits = { orange: string };
    `).get('declaration') as NodePath<TypeAlias>,
  });

  test('detects simple types', () => {
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
      const typePath = parse
        .expression<TypeCastExpression>('x: ' + type)
        .get('typeAnnotation')
        .get('typeAnnotation');

      expect(getFlowType(typePath)).toEqual({ name: type });
    });
  });

  test('detects literal types', () => {
    const literalTypes = ['"foo"', 1234, true];

    literalTypes.forEach(value => {
      const typePath = parse
        .expression<TypeCastExpression>(`x: ${value}`)
        .get('typeAnnotation')
        .get('typeAnnotation');

      expect(getFlowType(typePath)).toEqual({
        name: 'literal',
        value: `${value}`,
      });
    });
  });

  test('detects external type', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: xyz')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({ name: 'xyz' });
  });

  test('resolves an imported type', () => {
    const typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: xyz);
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'string',
    });
  });

  test('detects external nullable type', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: ?xyz')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'xyz',
      nullable: true,
    });
  });

  test('resolves an imported nullable type', () => {
    const typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: ?xyz);
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'string',
      nullable: true,
    });
  });

  test('detects array type shorthand optional', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: ?number[]')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'number[]',
      nullable: true,
    });
  });

  test('detects array type shorthand optional type', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: (?number)[]')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number', nullable: true }],
      raw: '(?number)[]',
    });
  });

  test('detects array type shorthand', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: number[]')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'number[]',
    });
  });

  test('detects array type', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: Array<number>')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'Array<number>',
    });
  });

  test('resolves imported types used for arrays', () => {
    let typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: Array<xyz>);
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'string' }],
      raw: 'Array<xyz>',
    });

    typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: xyz[]);
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'string' }],
      raw: 'xyz[]',
    });

    typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: ?xyz[]);
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'string' }],
      raw: 'xyz[]',
      nullable: true,
    });

    typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: (?xyz)[]);
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'string', nullable: true }],
      raw: '(?xyz)[]',
    });
  });

  test('detects array type with multiple types', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: Array<number, xyz>')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }, { name: 'xyz' }],
      raw: 'Array<number, xyz>',
    });
  });

  test('resolves array type with multiple imported types', () => {
    const typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: Array<abc, xyz>);
      import type { abc } from 'abc';
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }, { name: 'string' }],
      raw: 'Array<abc, xyz>',
    });
  });

  test('detects class type', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: Class<Boolean>')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Class',
      elements: [{ name: 'Boolean' }],
      raw: 'Class<Boolean>',
    });
  });

  test('resolves imported subtype for class type', () => {
    const typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: Class<xyz>);
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Class',
      elements: [{ name: 'string' }],
      raw: 'Class<xyz>',
    });
  });

  test('detects function type with subtype', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: Function<xyz>')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Function',
      elements: [{ name: 'xyz' }],
      raw: 'Function<xyz>',
    });
  });

  test('resolves imported subtype for function type', () => {
    const typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: Function<xyz>);
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'Function',
      elements: [{ name: 'string' }],
      raw: 'Function<xyz>',
    });
  });

  test('detects object types', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: { a: string, b?: xyz }')
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

  test('detects object types with maybe type', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: { a: string, b: ?xyz }')
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

  test('resolves imported types used for objects', () => {
    const typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: { a: abc, b: ?xyz, c?: xyz, d: maybe, e?: maybe });
      import type { abc } from 'abc';
      import type { xyz } from 'xyz';
      import type { maybe } from 'maybe';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
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

  test('detects union type', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: string | xyz | "foo" | void')
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

  test('resolves imported types within union type', () => {
    const typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: string | barbaz | "foo" | void);
      import type { barbaz } from 'barbaz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
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

  test('detects intersection type', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: string & xyz & "foo" & void')
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

  test('resolves imported types within intersection type', () => {
    const typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: string & barbaz & "foo" & void);
      import type { barbaz } from 'barbaz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
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

  test('detects function signature type', () => {
    const typePath = parse
      .expression<TypeCastExpression>(
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

  test('detects function signature types without parameter names', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: (number, ?string) => boolean')
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

  test('detects function signature type with single parmeter without name', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: string => boolean')
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

  test('detects callable signature type', () => {
    const typePath = parse
      .expression<TypeCastExpression>(
        'x: { (str: string): string, token: string }',
      )
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

  test('resolves function signature types with imported types', () => {
    let typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: (p1: abc, p2: ?xyz, ...rest: Array<xyz>) => def);
      import type { abc } from 'abc';
      import type { def } from 'def';
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
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
              elements: [{ name: 'string', nullable: true }],
              raw: 'Array<xyz>',
            },
          },
        ],
        return: { name: 'boolean' },
      },
      raw: '(p1: abc, p2: ?xyz, ...rest: Array<xyz>) => def',
    });

    typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: (abc, ?xyz) => def);
      import type { abc } from 'abc';
      import type { def } from 'def';
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
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
      raw: '(abc, ?xyz) => def',
    });

    typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: xyz => def);
      import type { def } from 'def';
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [{ name: '', type: { name: 'string' } }],
        return: { name: 'boolean' },
      },
      raw: 'xyz => def',
    });

    typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: { (str: xyz): abc, token: def });
      import type { abc } from 'abc';
      import type { def } from 'def';
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
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

  test('detects map signature', () => {
    const typePath = parse
      .expression<TypeCastExpression>(
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

  test('resolves imported types in map signature', () => {
    const typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: { [key: xyz]: abc, [key: "xl"]: def, token: barbaz });
      import type { abc } from 'abc';
      import type { def } from 'def';
      import type { xyz } from 'xyz';
      import type { barbaz } from 'barbaz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
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

  test('detects tuple signature', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: [string, number]')
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'tuple',
      elements: [{ name: 'string' }, { name: 'number' }],
      raw: '[string, number]',
    });
  });

  test('detects tuple in union signature', () => {
    const typePath = parse
      .expression<TypeCastExpression>('x: [string, number] | [number, string]')
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

  test('resolves imported types used in tuple signature', () => {
    let typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: [xyz, abc]);
      import type { abc } from 'abc';
      import type { xyz } from 'xyz';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
      name: 'tuple',
      elements: [{ name: 'string' }, { name: 'number' }],
      raw: '[xyz, abc]',
    });

    typePath = (
      parse
        .statement<ExpressionStatement>(
          `
      (x: [xyz, abc] | recTup);
      import type { abc } from 'abc';
      import type { xyz } from 'xyz';
      import type { recTup } from 'recTup';
    `,
          mockImporter,
        )
        .get('expression') as NodePath<TypeCastExpression>
    )
      .get('typeAnnotation')
      .get('typeAnnotation');

    expect(getFlowType(typePath)).toEqual({
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

  test('resolves types in scope', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: MyType = 2;

      type MyType = string;
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toEqual({
      name: 'string',
    });
  });

  test('handles typeof types', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: typeof MyType = {};

      type MyType = { a: string, b: ?xyz };
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

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

  test('resolves typeof of imported types', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: typeof MyType = {};
      import type { MyType } from 'MyType';
    `,
          mockImporter,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toEqual({
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

  test('handles qualified type identifiers', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: MyType.x = {};

      type MyType = { a: string, b: ?xyz };
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toEqual({
      name: 'MyType.x',
    });
  });

  test('handles qualified type identifiers with params', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: MyType.x<any> = {};

      type MyType = { a: string, b: ?xyz };
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

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

  test('handles generic types', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: MyType<string> = {};

      type MyType<T> = { a: T, b: Array<T> };
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

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

  test('resolves imported types that need subtypes', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: MyGenericType<string> = {};
      import type { MyGenericType } from 'MyGenericType';
    `,
          mockImporter,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

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
    function testReactType(type, expected) {
      const typePath = (
        parse
          .statement<VariableDeclaration>(
            `
        var x: ${type} = 2;

        type Props = { x: string };
      `,
          )
          .get('declarations')[0]
          .get('id') as NodePath<Identifier>
      )
        .get('typeAnnotation')
        .get('typeAnnotation') as NodePath<FlowType>;

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
      test(type, () => testReactType(type, types[type]));
    });
  });

  test('resolves $Keys to union', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: $Keys<typeof CONTENTS> = 2;
      const CONTENTS = {
        'apple': '🍎',
        'banana': '🍌',
      };
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: '$Keys<typeof CONTENTS>',
    });
  });

  test('resolves $Keys without typeof to union', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: $Keys<CONTENTS> = 2;
      const CONTENTS = {
        'apple': '🍎',
        'banana': '🍌',
      };
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: '$Keys<CONTENTS>',
    });
  });

  test('resolves $Keys with an ObjectTypeAnnotation typeParameter to union', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: $Keys<{| apple: string, banana: string |}> = 2;
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: 'apple' },
        { name: 'literal', value: 'banana' },
      ],
      raw: '$Keys<{| apple: string, banana: string |}>',
    });
  });

  test('resolves $Keys with an ObjectTypeAnnotation typeParameter to union with an ObjectTypeSpreadProperty', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: $Keys<{| apple: string, banana: string, ...OtherFruits |}> = 2;
      type OtherFruits = { orange: string }
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

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

  test('resolves $Keys to imported types', () => {
    let typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: $Keys<typeof CONTENTS> = 2;
      import CONTENTS from 'fruits';
    `,
          mockImporter,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: '$Keys<typeof CONTENTS>',
    });

    typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: $Keys<CONTENTS> = 2;
      import CONTENTS from 'fruits';
    `,
          mockImporter,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: '$Keys<CONTENTS>',
    });

    typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: $Keys<{| apple: string, banana: string, ...OtherFruits |}> = 2;
      import type { OtherFruits } from 'otherFruits';
    `,
          mockImporter,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

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

  test('handles multiple references to one type', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      let action: { a: Action, b: Action };
      type Action = {};
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

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

  test('handles self-referencing type cycles', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      let action: Action;
      type Action = { subAction: Action };
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

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

  test('handles long type cycles', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      let action: Action;
      type Action = { subAction: SubAction };
      type SubAction = { subAction: SubSubAction };
      type SubSubAction = { subAction: SubSubSubAction };
      type SubSubSubAction = { rootAction: Action };
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

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

  test('handles ObjectTypeSpreadProperty', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: {| apple: string, banana: string, ...OtherFruits |} = 2;
      type OtherFruits = { orange: string }
    `,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toMatchSnapshot();
  });

  test('handles ObjectTypeSpreadProperty from imported types', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: {| apple: string, banana: string, ...MyType |} = 2;
      import type { MyType } from 'MyType';
    `,
          mockImporter,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toMatchSnapshot();
  });

  test('handles unresolved ObjectTypeSpreadProperty', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `var x: {| apple: string, banana: string, ...MyType |} = 2;`,
          mockImporter,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toMatchSnapshot();
  });

  test('handles nested ObjectTypeSpreadProperty', () => {
    const typePath = (
      parse
        .statement<VariableDeclaration>(
          `
      var x: {| apple: string, banana: string, ...BreakfastFruits |} = 2;
      type BreakfastFruits = { mango: string, ...CitrusFruits };
      type CitrusFruits = { orange: string, lemon: string };
    `,
          mockImporter,
        )
        .get('declarations')[0]
        .get('id') as NodePath<Identifier>
    )
      .get('typeAnnotation')
      .get('typeAnnotation') as NodePath<FlowType>;

    expect(getFlowType(typePath)).toMatchSnapshot();
  });
});
