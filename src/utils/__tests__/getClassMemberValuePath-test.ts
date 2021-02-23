import getClassMemberValuePath from '../getClassMemberValuePath';
import { statement } from '../../../tests/utils';

describe('getClassMemberValuePath', () => {
  describe('MethodDefinitions', () => {
    it('finds "normal" method definitions', () => {
      const def = statement(`
        class Foo {
          render() {}
        }
      `);

      expect(getClassMemberValuePath(def, 'render')).toBe(
        def.get('body', 'body', 0, 'value'),
      );
    });

    it('finds computed method definitions with literal keys', () => {
      const def = statement(`
        class Foo {
          ['render']() {}
        }
      `);

      expect(getClassMemberValuePath(def, 'render')).toBe(
        def.get('body', 'body', 0, 'value'),
      );
    });

    it('ignores computed method definitions with expression', () => {
      const def = statement(`
        class Foo {
          [render]() {}
        }
      `);

      expect(getClassMemberValuePath(def, 'render')).not.toBeDefined();
    });
  });

  describe('Getters and Setters', () => {
    it('finds getters', () => {
      const def = statement(`
        class Foo {
          get foo() {}
        }
      `);

      expect(getClassMemberValuePath(def, 'foo')).toBe(
        def.get('body', 'body', 0, 'value'),
      );
    });

    it('ignores setters', () => {
      const def = statement(`
        class Foo {
          set foo(val) {}
        }
      `);

      expect(getClassMemberValuePath(def, 'foo')).not.toBeDefined();
    });
  });

  describe('ClassProperty', () => {
    it('finds "normal" class properties', () => {
      const def = statement(`
        class Foo {
          foo = 42;
        }
      `);

      expect(getClassMemberValuePath(def, 'foo')).toBe(
        def.get('body', 'body', 0, 'value'),
      );
    });
  });

  describe('PrivateClassProperty', () => {
    it('ignores private class properties', () => {
      const def = statement(`
        class Foo {
          #foo = 42;
        }
      `);

      expect(getClassMemberValuePath(def, 'foo')).toBe(undefined);
    });

    it('finds "normal" class properties with private present', () => {
      const def = statement(`
        class Foo {
          #private = 54;
          foo = 42;
        }
      `);

      expect(getClassMemberValuePath(def, 'foo')).toBe(
        def.get('body', 'body', 1, 'value'),
      );
    });
  });
});
