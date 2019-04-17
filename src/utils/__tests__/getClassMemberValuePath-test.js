/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('getClassMemberValuePath', () => {
  let getClassMemberValuePath;
  let statement;

  beforeEach(() => {
    getClassMemberValuePath = require('../getClassMemberValuePath').default;
    ({ statement } = require('../../../tests/utils'));
  });

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
