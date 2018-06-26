/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/* eslint-env jest */

import recast from 'recast';

const builders = recast.types.builders;
import resolveObjectKeysToArray from '../resolveObjectKeysToArray';
import * as utils from '../../../tests/utils';

describe('resolveObjectKeysToArray', () => {
  function parse(src) {
    const root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  it('resolves Object.keys with identifiers', () => {
    const path = parse(
      ['var foo = { bar: 1, foo: 2 };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path).node).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('foo'),
      ]),
    );
  });

  it('resolves Object.keys with literals', () => {
    const path = parse(
      ['var foo = { "bar": 1, 5: 2 };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path).node).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('5'),
      ]),
    );
  });

  it('resolves Object.keys with literals as computed key', () => {
    const path = parse(
      ['var foo = { ["bar"]: 1, [5]: 2};', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path).node).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('5'),
      ]),
    );
  });

  it('resolves Object.keys when using resolvable spread', () => {
    const path = parse(
      [
        'var bar = { doo: 4 }',
        'var foo = { boo: 1, foo: 2, ...bar };',
        'Object.keys(foo);',
      ].join('\n'),
    );

    expect(resolveObjectKeysToArray(path).node).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('boo'),
        builders.literal('foo'),
        builders.literal('doo'),
      ]),
    );
  });

  it('resolves Object.keys when using getters', () => {
    const path = parse(
      ['var foo = { boo: 1, foo: 2, get bar() {} };', 'Object.keys(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectKeysToArray(path).node).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('boo'),
        builders.literal('foo'),
        builders.literal('bar'),
      ]),
    );
  });

  it('resolves Object.keys when using setters', () => {
    const path = parse(
      [
        'var foo = { boo: 1, foo: 2, set bar(e) {} };',
        'Object.keys(foo);',
      ].join('\n'),
    );

    expect(resolveObjectKeysToArray(path).node).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('boo'),
        builders.literal('foo'),
        builders.literal('bar'),
      ]),
    );
  });

  it('resolves Object.keys but ignores duplicates', () => {
    const path = parse(
      [
        'var bar = { doo: 4, doo: 5 }',
        'var foo = { boo: 1, foo: 2, doo: 1, ...bar };',
        'Object.keys(foo);',
      ].join('\n'),
    );

    expect(resolveObjectKeysToArray(path).node).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('boo'),
        builders.literal('foo'),
        builders.literal('doo'),
      ]),
    );
  });

  it('resolves Object.keys but ignores duplicates with getter and setter', () => {
    const path = parse(
      ['var foo = { get x() {}, set x(a) {} };', 'Object.keys(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectKeysToArray(path).node).toEqualASTNode(
      builders.arrayExpression([builders.literal('x')]),
    );
  });

  it('does not resolve Object.keys when using unresolvable spread', () => {
    const path = parse(
      ['var foo = { bar: 1, foo: 2, ...bar };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toBeNull();
  });

  it('does not resolve Object.keys when using computed keys', () => {
    const path = parse(
      ['var foo = { [bar]: 1, foo: 2 };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toBeNull();
  });
});
