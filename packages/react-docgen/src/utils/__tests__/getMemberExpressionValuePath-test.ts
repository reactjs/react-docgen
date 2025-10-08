import type { ObjectMethod, VariableDeclaration } from '@babel/types';
import { parse } from '../../../tests/utils';
import getMemberExpressionValuePath from '../getMemberExpressionValuePath.js';
import { describe, expect, test } from 'vitest';
import type { NodePath } from '@babel/traverse';

describe('getMemberExpressionValuePath', () => {
  describe('MethodExpression', () => {
    test('finds "normal" property definitions', () => {
      const def = parse.statement(`
        var Foo = () => {};
        Foo.propTypes = {};
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parentPath.get('body')[1].get('expression').get('right'),
      );
    });

    test('ignores unrelated private field', () => {
      const def = parse.statement(
        `
        class Foo {
          #isprivate = {};

          classMethod() {
            this.#isprivate = {};
          }
        }
        const Boo = () => {};
        Boo.propTypes = {};
      `,
        1,
      );

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parentPath.get('body')[2].get('expression').get('right'),
      );
    });

    test('takes the correct property definitions', () => {
      const def = parse.statement(`
        var Foo = () => {};
        Foo.propTypes = {};
        Bar.propTypes = { unrelated: true };
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parentPath.get('body')[1].get('expression').get('right'),
      );
    });

    test('finds computed property definitions with literal keys', () => {
      const def = parse.statement(`
        function Foo () {}
        Foo['render'] = () => {};
      `);

      expect(getMemberExpressionValuePath(def, 'render')).toBe(
        def.parentPath.get('body')[1].get('expression').get('right'),
      );
    });

    test('handles template literals', () => {
      const def = parse.statement(`
        var Foo = function Bar() {};
        Foo[\`some\${template}\`] = () => {};
      `);

      expect(getMemberExpressionValuePath(def, 'something')).toBeNull();
    });

    test('ignores computed property definitions with expression', () => {
      const def = parse.statement(`
        var Foo = function Bar() {};
        Foo[imComputed] = () => {};
      `);

      expect(getMemberExpressionValuePath(def, 'imComputed')).toBeNull();
    });
  });
  describe('TaggedTemplateLiteral', () => {
    test('finds "normal" property definitions', () => {
      const def = parse.statement(`
        var Foo = foo\`bar\`
        Foo.propTypes = {};
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parentPath.get('body')[1].get('expression').get('right'),
      );
    });
  });
  describe('CallExpression', () => {
    test('finds "normal" property definitions', () => {
      const def = parse.statement(`
        const Foo = system({is: "button"}, "space");
        Foo.propTypes = {};
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parentPath.get('body')[1].get('expression').get('right'),
      );
    });
  });
  describe('ObjectMethod', () => {
    test('ignores ObjectMethod', () => {
      const def = parse.statement<VariableDeclaration>(`
        const slice = createSlice({
          example(state, action) {
          },
        });
      `);

      // path to `action.payload.id`
      const path = def
        .get('declarations')[0]
        .get('init')
        .get('arguments')[0]
        .get('properties')[0] as NodePath<ObjectMethod>;

      expect(getMemberExpressionValuePath(path, 'images')).toBe(null);
    });
  });
});
