import { expression, noopImporter } from '../../../tests/utils';
import { Array as expressionToArray } from '../expressionTo';

describe('expressionTo', () => {
  describe('MemberExpression', () => {
    it('with only identifiers', () => {
      expect(
        expressionToArray(expression('foo.bar.baz'), noopImporter),
      ).toEqual(['foo', 'bar', 'baz']);
    });

    it('with one computed literal', () => {
      expect(
        expressionToArray(expression('foo["bar"].baz'), noopImporter),
      ).toEqual(['foo', '"bar"', 'baz']);
    });

    it('with one computed identifier', () => {
      expect(
        expressionToArray(expression('foo[bar].baz'), noopImporter),
      ).toEqual(['foo', 'bar', 'baz']);
    });

    it('with one computed object', () => {
      expect(
        expressionToArray(expression('foo[{ a: "true"}].baz'), noopImporter),
      ).toEqual(['foo', '{a: "true"}', 'baz']);
    });

    it('with one computed object with spread', () => {
      expect(
        expressionToArray(expression('foo[{ ...a }].baz'), noopImporter),
      ).toEqual(['foo', '{...a}', 'baz']);
    });

    it('with one computed object with method', () => {
      expect(
        expressionToArray(expression('foo[{ a(){} }].baz'), noopImporter),
      ).toEqual(['foo', '{a: <function>}', 'baz']);
    });
  });
});
