import { parse, parseTypescript } from '../../../tests/utils';
import { Array as expressionToArray } from '../expressionTo';

describe('expressionTo', () => {
  describe('MemberExpression', () => {
    it('with only identifiers', () => {
      expect(expressionToArray(parse.expression('foo.bar.baz'))).toEqual([
        'foo',
        'bar',
        'baz',
      ]);
    });

    it('with one computed literal', () => {
      expect(expressionToArray(parse.expression('foo["bar"].baz'))).toEqual([
        'foo',
        '"bar"',
        'baz',
      ]);
    });

    it('with one computed identifier', () => {
      expect(expressionToArray(parse.expression('foo[bar].baz'))).toEqual([
        'foo',
        'bar',
        'baz',
      ]);
    });

    it('with one computed object', () => {
      expect(
        expressionToArray(parse.expression('foo[{ a: "true"}].baz')),
      ).toEqual(['foo', '{a: "true"}', 'baz']);
    });

    it('with one computed object with spread', () => {
      expect(expressionToArray(parse.expression('foo[{ ...a }].baz'))).toEqual([
        'foo',
        '{...a}',
        'baz',
      ]);
    });

    it('with one computed object with method', () => {
      expect(expressionToArray(parse.expression('foo[{ a(){} }].baz'))).toEqual(
        ['foo', '{a: <function>}', 'baz'],
      );
    });

    it('with TSAsExpression', () => {
      expect(
        expressionToArray(parseTypescript.expression('(baz as X).prop')),
      ).toEqual(['baz', 'prop']);
    });
  });
});
