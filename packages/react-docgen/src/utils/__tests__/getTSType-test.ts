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
import getTSType from '../getTSType.js';
import { describe, expect, test } from 'vitest';

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
  test('detects simple types', () => {
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

      expect(getTSType(typePath)).toMatchSnapshot();
    });
  });

  describe('literal types', () => {
    const literalTypes = ['"foo"', 1234, true, -1, '`foo`'];

    literalTypes.forEach(value => {
      test(`detects ${value}`, () => {
        const typePath = typeAlias(`let x: ${value};`);

        expect(getTSType(typePath)).toMatchSnapshot();
      });
    });
  });

  test('detects external type', () => {
    const typePath = typeAlias('let x: xyz;');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves external type', () => {
    const typePath = typeAlias(
      `
      let x: xyz;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects array type shorthand', () => {
    const typePath = typeAlias('let x: number[];');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects array type', () => {
    const typePath = typeAlias('let x: Array<number>;');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects array type with multiple types', () => {
    const typePath = typeAlias('let x: Array<number, xyz>;');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported types used for arrays', () => {
    let typePath = typeAlias(
      `
      let x: xyz[];
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();

    typePath = typeAlias(
      `
      let x: Array<xyz>;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toMatchSnapshot();

    typePath = typeAlias(
      `
      let x: Array<number, xyz>;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects class type', () => {
    const typePath = typeAlias('let x: Class<Boolean>;');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported subtype for class type', () => {
    const typePath = typeAlias(
      `
      let x: Class<xyz>;
      import { xyz } from 'xyz'
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects function type with subtype', () => {
    const typePath = typeAlias('let x: Function<xyz>;');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported subtype for function type', () => {
    const typePath = typeAlias(
      `
      let x: Function<xyz>;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects object types', () => {
    const typePath = typeAlias('let x: { a: string, b?: xyz };');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported types for object property types', () => {
    const typePath = typeAlias(
      `
      let x: { a: number, b?: xyz };
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects union type', () => {
    const typePath = typeAlias('let x: string | xyz | "foo" | void;');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported types within union type', () => {
    const typePath = typeAlias(
      `
      let x: string | barbaz | "foo" | void;
      import { barbaz } from 'barbaz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects intersection type', () => {
    const typePath = typeAlias('let x: string & xyz & "foo" & void;');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported types within intersection type', () => {
    const typePath = typeAlias(
      `
      let x: string & barbaz & "foo" & void;
      import { barbaz } from 'barbaz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects function signature type', () => {
    const typePath = typeAlias(
      'let x: (p1: number, p2: string, ...rest: Array<string>) => boolean;',
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects function signature type with `this` parameter', () => {
    const typePath = typeAlias('let x: (this: Foo, p1: number) => boolean;');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects callable signature type', () => {
    const typePath = typeAlias(
      'let x: { (str: string): string, token: string };',
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves function signature types with imported types', () => {
    let typePath = typeAlias(
      `
      let x: (p1: abc, p2: xyz, ...rest: Array<xyz>) => def;
      import { abc } from 'abc';
      import { def } from 'def';
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();

    typePath = typeAlias(
      `
      let x: (this: xyz, p1: number) => boolean;
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();

    typePath = typeAlias(
      `
      let x: { (str: xyz): abc, token: def };
      import { abc } from 'abc';
      import { def } from 'def';
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects map signature', () => {
    const typePath = typeAlias(
      'let x: { [key: string]: number, [key: "xl"]: string, token: "a" | "b" };',
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported types in map signature', () => {
    const typePath = typeAlias(
      `
      let x: { [key: xyz]: abc, [key: "xl"]: xyz, token: barbaz };
      import { abc } from 'abc';
      import { xyz } from 'xyz';
      import { barbaz } from 'barbaz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects tuple signature', () => {
    const typePath = typeAlias('let x: [string, number];');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects tuple in union signature', () => {
    const typePath = typeAlias('let x: [string, number] | [number, string];');

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported types in tuple signatures', () => {
    let typePath = typeAlias(
      `
      let x: [xyz, abc];
      import { abc } from 'abc';
      import { xyz } from 'xyz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();

    typePath = typeAlias(
      `
      let x: [xyz, abc] | recTup;
      import { abc } from 'abc';
      import { xyz } from 'xyz';
      import { recTup } from 'recTup';
    `,
      mockImporter,
    );
    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('detects indexed access', () => {
    const typePath = typeAlias(`
      var x: A["x"] = 2;

      interface A { x: string };
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves indexed access', () => {
    const typePath = typeAlias(`
      var x: A["x"] = 2;

      type A = { x: string };
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves indexed access of array', () => {
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

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('can resolve indexed access to imported type', () => {
    const typePath = typeAlias(
      `
      var x: A["x"] = 2;
      import { A } from 'obj';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves types in scope', () => {
    const typePath = typeAlias(`
      var x: MyType = 2;

      type MyType = string;
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles typeof types', () => {
    const typePath = typeAlias(`
      var x: typeof MyType = {};

      type MyType = { a: string, b: xyz };
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves typeof of imported types', () => {
    const typePath = typeAlias(
      `
      var x: typeof MyType = {};
      import { MyType } from 'MyType';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles qualified type identifiers', () => {
    const typePath = typeAlias(`
      var x: MyType.x = {};

      type MyType = { a: string, b: xyz };
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles qualified type identifiers with params', () => {
    const typePath = typeAlias(`
      var x: MyType.x<any> = {};

      type MyType = { a: string, b: xyz };
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles generic types', () => {
    const typePath = typeAlias(`
      var x: MyType<string> = {};

      type MyType<T> = { a: T, b: Array<T> };
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported types that need subtypes', () => {
    const typePath = typeAlias(
      `
      var x: MyGenericType<string> = {};
      import { MyGenericType } from 'MyGenericType';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles mapped types', () => {
    const typePath = typeAlias(`
      var x: { [key in 'x' | 'y']: boolean};
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves imported types applied to mapped types', () => {
    const typePath = typeAlias(
      `
      var x: { [key in barbaz]: boolean};
      import { barbaz } from 'barbaz';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  describe('React types', () => {
    const types = [
      'React.Node',
      'React.Key',
      'React.ElementType',
      'React.ChildrenArray<string>',
      'React.Element<any>',
      'React.Ref<typeof Component>',
      'React.ElementProps<Component>',
      'React.ElementRef<Component>',
      'React.ComponentType<Props>',
      'React.StatelessFunctionalComponent<Props2>',
    ];

    types.forEach(type => {
      test(type, () => {
        const typePath = typeAlias(`
          var x: ${type} = 2;

          type Props = { x: string };
        `);

        expect(getTSType(typePath)).toMatchSnapshot();
      });
    });
  });

  test('resolves keyof to union', () => {
    const typePath = typeAlias(`
      var x: keyof typeof CONTENTS = 2;
      const CONTENTS = {
        'apple': '🍎',
        'banana': '🍌',
      };
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves keyof with imported types', () => {
    const typePath = typeAlias(
      `
      var x: keyof typeof CONTENTS = 2;
      import CONTENTS from 'fruits';
    `,
      mockImporter,
    );

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('resolves keyof with inline object to union', () => {
    const typePath = typeAlias(`
      var x: keyof { apple: string, banana: string } = 2;
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles multiple references to one type', () => {
    const typePath = typeAlias(`
      let action: { a: Action, b: Action };
      type Action = {};
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles generics of the same Name', () => {
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
      .get('typeAnnotation') as NodePath<TSTypeAnnotation>;

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles self-referencing type cycles', () => {
    const typePath = typeAlias(`
      let action: Action;
      type Action = { subAction: Action };
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles long type cycles', () => {
    const typePath = typeAlias(`
      let action: Action;
      type Action = { subAction: SubAction };
      type SubAction = { subAction: SubSubAction };
      type SubSubAction = { subAction: SubSubSubAction };
      type SubSubSubAction = { rootAction: Action };
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles mapped type', () => {
    const typePath = typeAlias(`
      let action: OptionsFlags<X>;
      type OptionsFlags<Type> = {
        [Property in keyof Type]: number;
      };
      interface X {
        foo: string
      }
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles mapped type with implicit any', () => {
    const typePath = typeAlias(`
      let action: OptionsFlags<X>;
      type OptionsFlags<Type> = {
        [Property in keyof Type];
      };
      interface X {
        foo: string
      }
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });

  test('handles mapped type without typeParam', () => {
    const typePath = typeAlias(`
      let action: OptionsFlags;
      type OptionsFlags = {
        [Property in keyof X]: string;
      };
      interface X {
        foo: string
      }
    `);

    expect(getTSType(typePath)).toMatchSnapshot();
  });
});
