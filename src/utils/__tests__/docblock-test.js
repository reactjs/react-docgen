/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global describe, it, expect*/
import os from 'os';
import { statement } from '../../../tests/utils';

import { getDoclets, getDocblock } from '../docblock';

const EOL = os.EOL;

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
    let comment = ['This is a docblock.', 'This is the second line.'];
    let source = ['/**', ` * ${comment[0]}`, ` * ${comment[1]}`, ' */', 'foo;'];

    it('gets the closest docblock of the given node', () => {
      let node = statement(source.join(EOL));
      expect(getDocblock(node)).toEqual(comment.join(EOL));
    });

    let terminators = ['\u000A', '\u000D', '\u2028', '\u2029', '\u000D\u000A'];
    terminators.forEach(t => {
      it('can handle ' + escape(t) + ' as line terminator', () => {
        let node = statement(source.join(t));
        expect(getDocblock(node)).toEqual(comment.join(EOL));
      });
    });

    it('supports "short" docblocks', () => {
      let node = statement('/** bar */\nfoo;');
      expect(getDocblock(node)).toEqual('bar');
    });
  });
});
