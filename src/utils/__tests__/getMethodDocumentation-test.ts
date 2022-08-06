import type { NodePath } from '@babel/traverse';
import type {
  ClassDeclaration,
  ClassMethod,
  ClassPrivateMethod,
  ClassProperty,
  ObjectExpression,
  ObjectMethod,
} from '@babel/types';
import { parse, makeMockImporter, parseTypescript } from '../../../tests/utils';
import getMethodDocumentation from '../getMethodDocumentation';

describe('getMethodDocumentation', () => {
  const mockImporter = makeMockImporter({
    hello: stmt =>
      stmt(`
      export default () => {};
    `).get('declaration'),

    bar: stmt =>
      stmt(`
      export default (bar: number) => {};
    `).get('declaration'),

    baz: stmt =>
      stmt(`
      export default (): number => {};
    `).get('declaration'),
  });

  describe('name', () => {
    it('extracts the method name', () => {
      const def = parse.statement<ClassDeclaration>(`
        class Foo {
          hello() {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

      expect(getMethodDocumentation(method)).toEqual({
        name: 'hello',
        docblock: null,
        modifiers: [],
        returns: null,
        params: [],
      });
    });

    it('handles function assignment', () => {
      const def = parse.statement<ClassDeclaration>(`
        class Foo {
          hello = () => {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassProperty>;

      expect(getMethodDocumentation(method)).toEqual({
        name: 'hello',
        docblock: null,
        modifiers: [],
        returns: null,
        params: [],
      });
    });

    it('handles computed method name', () => {
      const def = parse.statement<ClassDeclaration>(`
        class Foo {
          [foo]() {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

      expect(getMethodDocumentation(method)).toMatchSnapshot();
    });

    it('ignores complex computed method name', () => {
      const def = parse.statement<ClassDeclaration>(`
        class Foo {
          [() => {}]() {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

      expect(getMethodDocumentation(method)).toMatchSnapshot();
    });

    it('resolves assignment of imported function', () => {
      const def = parse.statement<ClassDeclaration>(
        `
        class Foo {
          hello = hello;
        }
        import hello from 'hello';
      `,
        mockImporter,
      );
      const method = def.get('body').get('body')[0] as NodePath<ClassProperty>;

      expect(getMethodDocumentation(method)).toEqual({
        name: 'hello',
        docblock: null,
        modifiers: [],
        returns: null,
        params: [],
      });
    });
  });

  describe('docblock', () => {
    it('extracts the method docblock', () => {
      const def = parse.statement<ClassDeclaration>(`
        class Foo {
          /**
           * Don't use this!
           */
          foo() {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

      expect(getMethodDocumentation(method)).toEqual({
        name: 'foo',
        docblock: "Don't use this!",
        modifiers: [],
        returns: null,
        params: [],
      });
    });

    it('extracts docblock on function assignment', () => {
      const def = parse.statement<ClassDeclaration>(`
        class Foo {
          /**
           * Don't use this!
           */
          foo = () => {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassProperty>;

      expect(getMethodDocumentation(method)).toEqual({
        name: 'foo',
        docblock: "Don't use this!",
        modifiers: [],
        returns: null,
        params: [],
      });
    });
  });

  describe('parameters', () => {
    it('extracts flow type info', () => {
      const def = parse.statement<ClassDeclaration>(`
        class Foo {
          foo(bar: number) {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

      expect(getMethodDocumentation(method)).toMatchSnapshot();
    });

    it('extracts flow type info', () => {
      const def = parseTypescript.statement<ClassDeclaration>(`
        class Foo {
          foo(bar: number) {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

      expect(getMethodDocumentation(method)).toMatchSnapshot();
    });

    it('does not add type parameters to alias', () => {
      const def = parseTypescript.statement<ClassDeclaration>(`
        class Foo<T> {
          foo(bar: Foo<T>) {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

      expect(getMethodDocumentation(method)).toMatchSnapshot();
    });

    it('extracts flow type info on function assignment', () => {
      const def = parse.statement<ClassDeclaration>(`
        class Foo {
          foo = (bar: number) => {}
        }
      `);
      const method = def.get('body').get('body')[0] as NodePath<ClassProperty>;

      expect(getMethodDocumentation(method)).toMatchSnapshot();
    });

    it('resolves flow type info on imported functions', () => {
      const def = parse.statement<ClassDeclaration>(
        `
        class Foo {
          foo = bar
        }
        import bar from 'bar';
      `,
        mockImporter,
      );
      const method = def.get('body').get('body')[0] as NodePath<ClassProperty>;

      expect(getMethodDocumentation(method)).toMatchSnapshot();
    });

    describe('modifiers', () => {
      function methodModifiersDoc(modifiers) {
        return {
          name: 'foo',
          docblock: null,
          modifiers,
          returns: null,
          params: [],
        };
      }

      it('detects no modifiers', () => {
        const def = parse.statement<ClassDeclaration>(`
          class Foo {
            foo() {}
          }
        `);
        const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

        expect(getMethodDocumentation(method)).toEqual(methodModifiersDoc([]));
      });

      it('detects static functions', () => {
        const def = parse.statement<ClassDeclaration>(`
          class Foo {
            static foo() {}
          }
        `);
        const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc(['static']),
        );
      });

      it('detects manually set static functions', () => {
        const def = parse.expression<ObjectExpression>(`{ foo() {} }`);
        const method = def.get('properties')[0] as NodePath<ObjectMethod>;

        expect(getMethodDocumentation(method, { isStatic: true })).toEqual(
          methodModifiersDoc(['static']),
        );
      });

      it('detects generators', () => {
        const def = parse.statement<ClassDeclaration>(`
          class Foo {
            *foo () {}
          }
        `);
        const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc(['generator']),
        );
      });

      it('detects async functions', () => {
        const def = parse.statement<ClassDeclaration>(`
          class Foo {
            async foo () {}
          }
        `);
        const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc(['async']),
        );
      });

      it('detects static async functions', () => {
        const def = parse.statement<ClassDeclaration>(`
          class Foo {
            static async foo () {}
          }
        `);
        const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc(['static', 'async']),
        );
      });
    });

    describe('returns', () => {
      function methodReturnDoc(returnValue) {
        return {
          name: 'foo',
          docblock: null,
          modifiers: [],
          returns: returnValue,
          params: [],
        };
      }

      it('returns null if return is not documented', () => {
        const def = parse.statement<ClassDeclaration>(`
          class Foo {
            foo () {}
          }
        `);
        const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

        expect(getMethodDocumentation(method)).toEqual(methodReturnDoc(null));
      });

      it('extracts flow types', () => {
        const def = parse.statement<ClassDeclaration>(`
          class Foo {
            foo (): number {}
          }
        `);
        const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

        expect(getMethodDocumentation(method)).toEqual(
          methodReturnDoc({
            type: { name: 'number' },
          }),
        );
      });

      it('extracts flow types on function assignment', () => {
        const def = parse.statement<ClassDeclaration>(`
          class Foo {
            foo = (): number => {}
          }
        `);
        const method = def
          .get('body')
          .get('body')[0] as NodePath<ClassProperty>;

        expect(getMethodDocumentation(method)).toEqual(
          methodReturnDoc({
            type: { name: 'number' },
          }),
        );
      });

      it('resolves flow types on imported functions', () => {
        const def = parse.statement<ClassDeclaration>(
          `
          class Foo {
            foo = baz
          }
          import baz from 'baz';
        `,
          mockImporter,
        );
        const method = def
          .get('body')
          .get('body')[0] as NodePath<ClassProperty>;

        expect(getMethodDocumentation(method)).toEqual(
          methodReturnDoc({
            type: { name: 'number' },
          }),
        );
      });
    });

    describe('private', () => {
      it('ignores private typescript methods', () => {
        const def = parseTypescript.statement<ClassDeclaration>(
          `
          class Foo {
            private foo() {}
          }
        `,
        );
        const method = def.get('body').get('body')[0] as NodePath<ClassMethod>;

        expect(getMethodDocumentation(method)).toMatchSnapshot();
      });

      it('ignores private methods', () => {
        const def = parse.statement<ClassDeclaration>(
          `class Foo {
            #foo() {}
          }`,
          { parserOpts: { plugins: ['classPrivateMethods'] } },
        );
        const method = def
          .get('body')
          .get('body')[0] as NodePath<ClassPrivateMethod>;

        expect(getMethodDocumentation(method)).toMatchSnapshot();
      });
    });
  });
});
