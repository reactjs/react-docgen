import { parse } from '../../../tests/utils';
import getMemberExpressionValuePath from '../getMemberExpressionValuePath';

describe('getMemberExpressionValuePath', () => {
  describe('MethodExpression', () => {
    it('finds "normal" property definitions', () => {
      const def = parse.statement(`
        var Foo = () => {};
        Foo.propTypes = {};
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parentPath.get('body')[1].get('expression').get('right'),
      );
    });

    it('takes the correct property definitions', () => {
      const def = parse.statement(`
        var Foo = () => {};
        Foo.propTypes = {};
        Bar.propTypes = { unrelated: true };
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parentPath.get('body')[1].get('expression').get('right'),
      );
    });

    it('finds computed property definitions with literal keys', () => {
      const def = parse.statement(`
        function Foo () {}
        Foo['render'] = () => {};
      `);

      expect(getMemberExpressionValuePath(def, 'render')).toBe(
        def.parentPath.get('body')[1].get('expression').get('right'),
      );
    });

    it('ignores computed property definitions with expression', () => {
      const def = parse.statement(`
        var Foo = function Bar() {};
        Foo[imComputed] = () => {};
      `);

      expect(getMemberExpressionValuePath(def, 'imComputed')).toBeNull();
    });
  });
  describe('TaggedTemplateLiteral', () => {
    it('finds "normal" property definitions', () => {
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
    it('finds "normal" property definitions', () => {
      const def = parse.statement(`
        const Foo = system({is: "button"}, "space");
        Foo.propTypes = {};
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parentPath.get('body')[1].get('expression').get('right'),
      );
    });
  });

  //TODO test arrow assigned to destructuring
});
