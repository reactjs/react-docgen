import getClassMemberValuePath from '../getClassMemberValuePath';
import { parse } from '../../../tests/utils';
import type { ClassDeclaration, ClassExpression } from '@babel/types';

describe('getClassMemberValuePath', () => {
  describe('ClassDeclaration', () => {
    describe('MethodDefinitions', () => {
      it('finds "normal" method definitions', () => {
        const def = parse.statement<ClassDeclaration>(`
        class Foo {
          render() {}
        }
      `);

        expect(getClassMemberValuePath(def, 'render')).toMatchSnapshot();
      });

      it('finds computed method definitions with literal keys', () => {
        const def = parse.statement<ClassDeclaration>(`
        class Foo {
          ['render']() {}
        }
      `);

        expect(getClassMemberValuePath(def, 'render')).toMatchSnapshot();
      });

      it('ignores computed method definitions with expression', () => {
        const def = parse.statement<ClassDeclaration>(`
        class Foo {
          [render]() {}
        }
      `);

        expect(getClassMemberValuePath(def, 'render')).toBeNull();
      });
    });

    describe('Getters and Setters', () => {
      it('finds getters', () => {
        const def = parse.statement<ClassDeclaration>(`
        class Foo {
          get foo() {}
        }
      `);

        expect(getClassMemberValuePath(def, 'foo')).toMatchSnapshot();
      });

      it('ignores setters', () => {
        const def = parse.statement<ClassDeclaration>(`
        class Foo {
          set foo(val) {}
        }
      `);

        expect(getClassMemberValuePath(def, 'foo')).toBeNull();
      });
    });

    describe('ClassProperty', () => {
      it('finds "normal" class properties', () => {
        const def = parse.statement<ClassDeclaration>(`
        class Foo {
          foo = 42;
        }
      `);

        expect(getClassMemberValuePath(def, 'foo')).toEqual(
          def.get('body').get('body')[0].get('value'),
        );
      });
    });

    describe('private', () => {
      it('ignores private class properties', () => {
        const def = parse.statement<ClassDeclaration>(`
        class Foo {
          #foo = 42;
        }
      `);

        expect(getClassMemberValuePath(def, 'foo')).toBeNull();
      });

      it('ignores private class methods', () => {
        const def = parse.statement<ClassDeclaration>(`
        class Foo {
          #foo() {}
        }
      `);

        expect(getClassMemberValuePath(def, 'foo')).toBeNull();
      });

      it('finds "normal" class properties with private present', () => {
        const def = parse.statement<ClassDeclaration>(`
        class Foo {
          #private = 54;
          foo = 42;
        }
      `);

        expect(getClassMemberValuePath(def, 'foo')).toBe(
          def.get('body').get('body')[1].get('value'),
        );
      });
    });
  });

  describe('ClassExpression', () => {
    it('finds "normal" method definitions', () => {
      const def = parse.expression<ClassExpression>(`
      class Foo {
        render() {}
      }
    `);

      expect(getClassMemberValuePath(def, 'render')).toMatchSnapshot();
    });
  });
});
