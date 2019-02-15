/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

const fs = require('fs');
const temp = require('temp');

jest.disableAutomock();

describe('parse', () => {
  let utils;
  let parse, ERROR_MISSING_DEFINITION;

  beforeEach(() => {
    utils = require('../../tests/utils');
    // ugly but necessary because ../parse has default and named exports
    ({ default: parse, ERROR_MISSING_DEFINITION } = require('../parse'));
  });

  function pathFromSource(source) {
    return utils.parse(source).get('body', 0, 'expression');
  }

  it('allows custom component definition resolvers', () => {
    const path = pathFromSource('({foo: "bar"})');
    const resolver = jest.fn(() => path);
    const handler = jest.fn();
    parse('//empty', resolver, [handler]);

    expect(resolver).toBeCalled();
    expect(handler.mock.calls[0][1]).toBe(path);
  });

  it('errors if component definition is not found', () => {
    const resolver = jest.fn();
    expect(() => parse('//empty', resolver)).toThrowError(
      ERROR_MISSING_DEFINITION,
    );
    expect(resolver).toBeCalled();

    expect(() => parse('//empty', resolver)).toThrowError(
      ERROR_MISSING_DEFINITION,
    );
    expect(resolver).toBeCalled();
  });

  it('uses local babelrc', () => {
    const dir = temp.mkdirSync();

    try {
      // Write and empty babelrc to override the parser defaults
      fs.writeFileSync(`${dir}/.babelrc`, '{}');

      expect(() =>
        parse('const chained  = () => foo?.bar?.join?.()', () => {}, null, {
          cwd: dir,
          filename: `${dir}/component.js`,
        }),
      ).toThrowError(
        /.*Support for the experimental syntax 'optionalChaining' isn't currently enabled.*/,
      );
    } finally {
      fs.unlinkSync(`${dir}/.babelrc`);
      fs.rmdirSync(dir);
    }
  });

  it('supports custom parserOptions', () => {
    expect(() =>
      parse('const chained: Type = 1;', () => {}, null, {
        parserOptions: {
          plugins: [
            // no flow
            'jsx',
          ],
        },
      }),
    ).toThrowError(/.*Unexpected token \(1:13\).*/);
  });
});
