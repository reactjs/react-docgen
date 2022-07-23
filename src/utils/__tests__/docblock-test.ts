import { parse } from '../../../tests/utils';
import { getDoclets, getDocblock } from '../docblock';

describe('docblock', () => {
  describe('getDoclets', () => {
    it('extracts single line doclets', () => {
      expect(getDoclets('@foo bar\n@bar baz')).toEqual({
        foo: 'bar',
        bar: 'baz',
      });
    });

    it('extracts multi line doclets', () => {
      expect(getDoclets('@foo bar\nbaz\n@bar baz')).toEqual({
        foo: 'bar\nbaz',
        bar: 'baz',
      });
    });

    it('extracts boolean doclets', () => {
      expect(getDoclets('@foo bar\nbaz\n@abc\n@bar baz')).toEqual({
        foo: 'bar\nbaz',
        abc: true,
        bar: 'baz',
      });
    });
  });

  describe('getDocblock', () => {
    const comment = ['This is a docblock.', 'This is the second line.'];
    const source = [
      '/**',
      ` * ${comment[0]}`,
      ` * ${comment[1]}`,
      ' */',
      'foo;',
    ];

    it('gets the closest docblock of the given node', () => {
      const node = parse.statement(source.join('\n'));
      expect(getDocblock(node)).toEqual(comment.join('\n'));
    });

    const terminators = [
      '\u000A', // \n
      '\u000D', // \r
      '\u2028',
      '\u2029',
      '\u000D\u000A', // \r\n
    ];
    terminators.forEach(t => {
      it('can handle ' + escape(t) + ' as line terminator', () => {
        const node = parse.statement(source.join(t));
        expect(getDocblock(node)).toEqual(comment.join(t));
      });
    });

    it('supports "short" docblocks', () => {
      const node = parse.statement('/** bar */\nfoo;');
      expect(getDocblock(node)).toEqual('bar');
    });
  });
});
