import type { NodePath } from '@babel/traverse';
import type {
  Declaration,
  ExportNamedDeclaration,
  TSInterfaceDeclaration,
  TSTypeAnnotation,
  TypeScript,
  VariableDeclaration,
} from '@babel/types';
import {
  parseTypescript,
  makeMockImporter,
  noopImporter,
} from '../../../tests/utils';
import type { Importer } from '../../importer';
import getTSType from '../getTSType';

function typeAlias(
  stmt: string,
  importer: Importer = noopImporter,
): NodePath<TypeScript> {
  return parseTypescript
    .statement<VariableDeclaration>(stmt, importer)
    .get(
      'declarations.0.id.typeAnnotation.typeAnnotation',
    ) as NodePath<TypeScript>;
}

const mockImporter = makeMockImporter({
  abc: stmtLast =>
    stmtLast<ExportNamedDeclaration>(`export type abc = number;`, true).get(
      'declaration',
    ) as NodePath<Declaration>,

  def: stmtLast =>
    stmtLast<ExportNamedDeclaration>(`export type def = boolean;`, true).get(
      'declaration',
    ) as NodePath<Declaration>,

  xyz: stmtLast =>
    stmtLast<ExportNamedDeclaration>(`export type xyz = string;`, true).get(
      'declaration',
    ) as NodePath<Declaration>,

  barbaz: stmtLast =>
    stmtLast<ExportNamedDeclaration>(
      `export type barbaz = "bar" | "baz";`,
      true,
    ).get('declaration') as NodePath<Declaration>,

  recTup: stmtLast =>
    stmtLast<ExportNamedDeclaration>(
      `import { abc } from 'abc';
       import { xyz } from 'xyz';
       export type recTup = [abc, xyz];`,
      true,
    ).get('declaration') as NodePath<Declaration>,

  obj: stmtLast =>
    stmtLast<ExportNamedDeclaration>(
      `export type A = { x: string };`,
      true,
    ).get('declaration') as NodePath<Declaration>,

  MyType: stmtLast =>
    stmtLast<ExportNamedDeclaration>(
      `import { xyz } from 'xyz';
       export type MyType = { a: number, b: xyz };`,
      true,
    ).get('declaration') as NodePath<Declaration>,

  MyGenericType: stmtLast =>
    stmtLast<ExportNamedDeclaration>(
      `export type MyGenericType<T> = { a: T, b: Array<T> };`,
      true,
    ).get('declaration') as NodePath<Declaration>,

  fruits: stmtLast =>
    stmtLast(
      `
    export default {
      'apple': '🍎',
      'banana': '🍌',
    };
  `,
    ).get('declaration'),
});

describe('getTSType', () => {
  it('detects simple types', () => {
    const simplePropTypes = [
      'string',
      'number',
      'boolean',
      'symbol',
      'object',
      'any',
      'unknown',
      'null',
      'undefined',
      'void',
      'Object',
      'Function',
      'Boolean',
      'String',
      'Number',
    ];

    simplePropTypes.forEach(type => {
      const typePath = typeAlias(`let x: ${type};`);
      expect(getTSType(typePath)).toEqual({ name: type });
    });
  });

  it('detects literal types', () => {
    const literalTypes = ['"foo"', 1234, true];

    literalTypes.forEach(value => {
      const typePath = typeAlias(`let x: ${value};`);
      expect(getTSType(typePath)).toEqual({
        name: 'literal',
        value: `${value}`,
      });
    });
  });

  it('detects external type', () => {
    const typePath = typeAlias('let x: xyz;');
    expect(getTSType(typePath)).toEqual({ name: 'xyz' });
  });

  it('resolves external type', () => {
    const typePath = typeAlias(
      `
      let x: xyz;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({ name: 'string' });
  });

  it('detects array type shorthand', () => {
    const typePath = typeAlias('let x: number[];');
    expect(getTSType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'number[]',
    });
  });

  it('detects array type', () => {
    const typePath = typeAlias('let x: Array<number>;');
    expect(getTSType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }],
      raw: 'Array<number>',
    });
  });

  it('detects array type with multiple types', () => {
    const typePath = typeAlias('let x: Array<number, xyz>;');
    expect(getTSType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }, { name: 'xyz' }],
      raw: 'Array<number, xyz>',
    });
  });

  it('resolves imported types used for arrays', () => {
    let typePath = typeAlias(
      `
      let x: xyz[];
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'string' }],
      raw: 'xyz[]',
    });

    typePath = typeAlias(
      `
      let x: Array<xyz>;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'string' }],
      raw: 'Array<xyz>',
    });

    typePath = typeAlias(
      `
      let x: Array<number, xyz>;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'Array',
      elements: [{ name: 'number' }, { name: 'string' }],
      raw: 'Array<number, xyz>',
    });
  });

  it('detects class type', () => {
    const typePath = typeAlias('let x: Class<Boolean>;');
    expect(getTSType(typePath)).toEqual({
      name: 'Class',
      elements: [{ name: 'Boolean' }],
      raw: 'Class<Boolean>',
    });
  });

  it('resolves imported subtype for class type', () => {
    const typePath = typeAlias(
      `
      let x: Class<xyz>;
      import { xyz } from 'xyz'
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'Class',
      elements: [{ name: 'string' }],
      raw: 'Class<xyz>',
    });
  });

  it('detects function type with subtype', () => {
    const typePath = typeAlias('let x: Function<xyz>;');
    expect(getTSType(typePath)).toEqual({
      name: 'Function',
      elements: [{ name: 'xyz' }],
      raw: 'Function<xyz>',
    });
  });

  it('resolves imported subtype for function type', () => {
    const typePath = typeAlias(
      `
      let x: Function<xyz>;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'Function',
      elements: [{ name: 'string' }],
      raw: 'Function<xyz>',
    });
  });

  it('detects object types', () => {
    const typePath = typeAlias('let x: { a: string, b?: xyz };');
    expect(getTSType(typePath)).toEqual({
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

  it('resolves imported types for object property types', () => {
    const typePath = typeAlias(
      `
      let x: { a: number, b?: xyz };
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          { key: 'a', value: { name: 'number', required: true } },
          { key: 'b', value: { name: 'string', required: false } },
        ],
      },
      raw: '{ a: number, b?: xyz }',
    });
  });

  it('detects union type', () => {
    const typePath = typeAlias('let x: string | xyz | "foo" | void;');
    expect(getTSType(typePath)).toEqual({
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
    const typePath = typeAlias(
      `
      let x: string | barbaz | "foo" | void;
      import { barbaz } from 'barbaz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
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
    const typePath = typeAlias('let x: string & xyz & "foo" & void;');
    expect(getTSType(typePath)).toEqual({
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
    const typePath = typeAlias(
      `
      let x: string & barbaz & "foo" & void;
      import { barbaz } from 'barbaz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
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
    const typePath = typeAlias(
      'let x: (p1: number, p2: string, ...rest: Array<string>) => boolean;',
    );
    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [
          { name: 'p1', type: { name: 'number' } },
          { name: 'p2', type: { name: 'string' } },
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
      raw: '(p1: number, p2: string, ...rest: Array<string>) => boolean',
    });
  });

  it('detects function signature type with `this` parameter', () => {
    const typePath = typeAlias('let x: (this: Foo, p1: number) => boolean;');
    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [{ name: 'p1', type: { name: 'number' } }],
        this: { name: 'Foo' },
        return: { name: 'boolean' },
      },
      raw: '(this: Foo, p1: number) => boolean',
    });
  });

  it('detects callable signature type', () => {
    const typePath = typeAlias(
      'let x: { (str: string): string, token: string };',
    );
    expect(getTSType(typePath)).toEqual({
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
          raw: '(str: string): string,', // TODO: why does it print a comma?
        },
        properties: [
          { key: 'token', value: { name: 'string', required: true } },
        ],
      },
      raw: '{ (str: string): string, token: string }',
    });
  });

  it('resolves function signature types with imported types', () => {
    let typePath = typeAlias(
      `
      let x: (p1: abc, p2: xyz, ...rest: Array<xyz>) => def;
      import { abc } from 'abc';
      import { def } from 'def';
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [
          { name: 'p1', type: { name: 'number' } },
          { name: 'p2', type: { name: 'string' } },
          {
            name: 'rest',
            rest: true,
            type: {
              name: 'Array',
              elements: [{ name: 'string' }],
              raw: 'Array<xyz>',
            },
          },
        ],
        return: { name: 'boolean' },
      },
      raw: '(p1: abc, p2: xyz, ...rest: Array<xyz>) => def',
    });

    typePath = typeAlias(
      `
      let x: (this: xyz, p1: number) => boolean;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'function',
      signature: {
        arguments: [{ name: 'p1', type: { name: 'number' } }],
        this: { name: 'string' },
        return: { name: 'boolean' },
      },
      raw: '(this: xyz, p1: number) => boolean',
    });

    typePath = typeAlias(
      `
      let x: { (str: xyz): abc, token: def };
      import { abc } from 'abc';
      import { def } from 'def';
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
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
          raw: '(str: xyz): abc,',
        },
        properties: [
          { key: 'token', value: { name: 'boolean', required: true } },
        ],
      },
      raw: '{ (str: xyz): abc, token: def }',
    });
  });

  it('detects map signature', () => {
    const typePath = typeAlias(
      'let x: { [key: string]: number, [key: "xl"]: string, token: "a" | "b" };',
    );
    expect(getTSType(typePath)).toEqual({
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
    const typePath = typeAlias(
      `
      let x: { [key: xyz]: abc, [key: "xl"]: xyz, token: barbaz };
      import { abc } from 'abc';
      import { xyz } from 'xyz';
      import { barbaz } from 'barbaz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          {
            key: { name: 'string', required: true },
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
              raw: '"bar" | "baz"',
              elements: [
                { name: 'literal', value: '"bar"' },
                { name: 'literal', value: '"baz"' },
              ],
            },
          },
        ],
      },
      raw: '{ [key: xyz]: abc, [key: "xl"]: xyz, token: barbaz }',
    });
  });

  it('detects tuple signature', () => {
    const typePath = typeAlias('let x: [string, number];');
    expect(getTSType(typePath)).toEqual({
      name: 'tuple',
      elements: [{ name: 'string' }, { name: 'number' }],
      raw: '[string, number]',
    });
  });

  it('detects tuple in union signature', () => {
    const typePath = typeAlias('let x: [string, number] | [number, string];');
    expect(getTSType(typePath)).toEqual({
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

  it('resolves imported types in tuple signatures', () => {
    let typePath = typeAlias(
      `
      let x: [xyz, abc];
      import { abc } from 'abc';
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'tuple',
      elements: [{ name: 'string' }, { name: 'number' }],
      raw: '[xyz, abc]',
    });

    typePath = typeAlias(
      `
      let x: [xyz, abc] | recTup;
      import { abc } from 'abc';
      import { xyz } from 'xyz';
      import { recTup } from 'recTup';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
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

  it('detects indexed access', () => {
    const typePath = typeAlias(`
      var x: A["x"] = 2;

      interface A { x: string };
    `);
    expect(getTSType(typePath)).toEqual({
      name: 'A["x"]',
      raw: 'A["x"]',
    });
  });

  it('resolves indexed access', () => {
    const typePath = typeAlias(`
      var x: A["x"] = 2;

      type A = { x: string };
    `);
    expect(getTSType(typePath)).toEqual({
      name: 'string',
      raw: 'A["x"]',
    });
  });

  it('resolves indexed access of array', () => {
    const typePath = parseTypescript
      .statement(
        `
      var x: typeof STRING_VALS[number];

      const STRING_VALS = [
        'one',
        'two',
        'three'
      ];
    `,
      )
      .get('declarations')[0]
      .get('id')
      .get('typeAnnotation')
      .get('typeAnnotation');
    expect(getTSType(typePath)).toEqual({
      name: 'STRING_VALS[number]',
      raw: 'typeof STRING_VALS[number]',
    });
  });

  it('can resolve indexed access to imported type', () => {
    const typePath = typeAlias(
      `
      var x: A["x"] = 2;
      import { A } from 'obj';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toEqual({
      name: 'string',
      raw: 'A["x"]',
    });
  });

  it('resolves types in scope', () => {
    const typePath = typeAlias(`
      var x: MyType = 2;

      type MyType = string;
    `);

    expect(getTSType(typePath)).toEqual({ name: 'string' });
  });

  it('handles typeof types', () => {
    const typePath = typeAlias(`
      var x: typeof MyType = {};

      type MyType = { a: string, b: xyz };
    `);

    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          { key: 'a', value: { name: 'string', required: true } },
          { key: 'b', value: { name: 'xyz', required: true } },
        ],
      },
      raw: '{ a: string, b: xyz }',
    });
  });

  it('resolves typeof of imported types', () => {
    const typePath = typeAlias(
      `
      var x: typeof MyType = {};
      import { MyType } from 'MyType';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      signature: {
        properties: [
          { key: 'a', value: { name: 'number', required: true } },
          { key: 'b', value: { name: 'string', required: true } },
        ],
      },
      raw: '{ a: number, b: xyz }',
    });
  });

  it('handles qualified type identifiers', () => {
    const typePath = typeAlias(`
      var x: MyType.x = {};

      type MyType = { a: string, b: xyz };
    `);

    expect(getTSType(typePath)).toEqual({
      name: 'MyType.x',
    });
  });

  it('handles qualified type identifiers with params', () => {
    const typePath = typeAlias(`
      var x: MyType.x<any> = {};

      type MyType = { a: string, b: xyz };
    `);

    expect(getTSType(typePath)).toEqual({
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
    const typePath = typeAlias(`
      var x: MyType<string> = {};

      type MyType<T> = { a: T, b: Array<T> };
    `);

    expect(getTSType(typePath)).toEqual({
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
    const typePath = typeAlias(
      `
      var x: MyGenericType<string> = {};
      import { MyGenericType } from 'MyGenericType';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toEqual({
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

  it('handles mapped types', () => {
    const typePath = typeAlias(`
      var x: { [key in 'x' | 'y']: boolean};
    `);

    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      raw: "{ [key in 'x' | 'y']: boolean}",
      signature: {
        properties: [
          {
            key: {
              elements: [
                {
                  name: 'literal',
                  value: "'x'",
                },
                {
                  name: 'literal',
                  value: "'y'",
                },
              ],
              name: 'union',
              raw: "'x' | 'y'",
              required: true,
            },
            value: {
              name: 'boolean',
            },
          },
        ],
      },
    });
  });

  it('resolves imported types applied to mapped types', () => {
    const typePath = typeAlias(
      `
      var x: { [key in barbaz]: boolean};
      import { barbaz } from 'barbaz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toEqual({
      name: 'signature',
      type: 'object',
      raw: '{ [key in barbaz]: boolean}',
      signature: {
        properties: [
          {
            key: {
              elements: [
                {
                  name: 'literal',
                  value: '"bar"',
                },
                {
                  name: 'literal',
                  value: '"baz"',
                },
              ],
              name: 'union',
              raw: '"bar" | "baz"',
              required: true,
            },
            value: {
              name: 'boolean',
            },
          },
        ],
      },
    });
  });

  describe('React types', () => {
    function test(type, expected) {
      const typePath = typeAlias(`
        var x: ${type} = 2;

        type Props = { x: string };
      `);

      expect(getTSType(typePath)).toEqual({
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

  it('resolves keyof to union', () => {
    const typePath = typeAlias(`
      var x: keyof typeof CONTENTS = 2;
      const CONTENTS = {
        'apple': '🍎',
        'banana': '🍌',
      };
    `);

    expect(getTSType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: 'keyof typeof CONTENTS',
    });
  });

  it('resolves keyof with imported types', () => {
    const typePath = typeAlias(
      `
      var x: keyof typeof CONTENTS = 2;
      import CONTENTS from 'fruits';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: "'apple'" },
        { name: 'literal', value: "'banana'" },
      ],
      raw: 'keyof typeof CONTENTS',
    });
  });

  it('resolves keyof with inline object to union', () => {
    const typePath = typeAlias(`
      var x: keyof { apple: string, banana: string } = 2;
    `);

    expect(getTSType(typePath)).toEqual({
      name: 'union',
      elements: [
        { name: 'literal', value: 'apple' },
        { name: 'literal', value: 'banana' },
      ],
      raw: 'keyof { apple: string, banana: string }',
    });
  });

  it('handles multiple references to one type', () => {
    const typePath = typeAlias(`
      let action: { a: Action, b: Action };
      type Action = {};
    `);

    expect(getTSType(typePath)).toEqual({
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

  it('handles generics of the same Name', () => {
    const typePath = parseTypescript
      .statement<TSInterfaceDeclaration>(
        `
      interface Props {
        baz: Foo<T>
      }

      type Foo<T> = Bar<T>
    `,
      )
      .get('body')
      .get('body')[0]
      .get('typeAnnotation');

    getTSType(typePath as NodePath<TSTypeAnnotation>, null);
  });

  it('handles self-referencing type cycles', () => {
    const typePath = typeAlias(`
      let action: Action;
      type Action = { subAction: Action };
    `);

    expect(getTSType(typePath)).toEqual({
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
    const typePath = typeAlias(`
      let action: Action;
      type Action = { subAction: SubAction };
      type SubAction = { subAction: SubSubAction };
      type SubSubAction = { subAction: SubSubSubAction };
      type SubSubSubAction = { rootAction: Action };
    `);

    expect(getTSType(typePath)).toEqual({
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
