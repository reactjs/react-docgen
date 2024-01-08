import { parse } from '../../../tests/utils';
import getMemberExpressionValuePath from '../getMemberExpressionValuePath.js';
import { describe, expect, test } from 'vitest';

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
});
