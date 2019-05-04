/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import types from 'ast-types';
import resolveObjectValuesToArray from '../resolveObjectValuesToArray';
import * as utils from '../../../tests/utils';

const { builders } = types;

describe('resolveObjectValuesToArray', () => {
  function parse(src) {
    const root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  it('resolves Object.values with strings', () => {
    const path = parse(
      ['var foo = { 1: "bar", 2: "foo" };', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('foo'),
      ]),
    );
  });

  it('resolves Object.values with numbers', () => {
    const path = parse(
      ['var foo = { 1: 0, 2: 5 };', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toEqualASTNode(
      builders.arrayExpression([builders.literal(0), builders.literal(5)]),
    );
  });

  it('resolves Object.values with undefined or null', () => {
    const path = parse(
      ['var foo = { 1: null, 2: undefined };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal(null),
        builders.literal(null),
      ]),
    );
  });

  it('resolves Object.values with literals as computed key', () => {
    const path = parse(
      ['var foo = { ["bar"]: 1, [5]: 2};', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toEqualASTNode(
      builders.arrayExpression([builders.literal(2), builders.literal(1)]),
    );
  });

  it('does not resolve Object.values with complex computed key', () => {
    const path = parse(
      ['var foo = { [()=>{}]: 1, [5]: 2};', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toBeNull();
  });

  it('resolves Object.values when using resolvable spread', () => {
    const path = parse(
      [
        'var bar = { doo: 4 }',
        'var foo = { boo: 1, foo: 2, ...bar };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal(1),
        builders.literal(4),
        builders.literal(2),
      ]),
    );
  });

  it('resolves Object.values when using getters', () => {
    const path = parse(
      [
        'var foo = { boo: 1, foo: 2, get bar() {} };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toEqualASTNode(
      builders.arrayExpression([builders.literal(1), builders.literal(2)]),
    );
  });

  it('resolves Object.values when using setters', () => {
    const path = parse(
      [
        'var foo = { boo: 1, foo: 2, set bar(e) {} };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toEqualASTNode(
      builders.arrayExpression([builders.literal(1), builders.literal(2)]),
    );
  });

  it('resolves Object.values but ignores duplicates', () => {
    const path = parse(
      [
        'var bar = { doo: 4, doo: 5 }',
        'var foo = { boo: 1, foo: 2, doo: 1, ...bar };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal(1),
        builders.literal(5),
        builders.literal(2),
      ]),
    );
  });

  it('resolves Object.values but ignores duplicates with getter and setter', () => {
    const path = parse(
      ['var foo = { get x() {}, set x(a) {} };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path)).toEqualASTNode(
      builders.arrayExpression([]),
    );
  });

  it('does not resolve Object.values when using unresolvable spread', () => {
    const path = parse(
      ['var foo = { bar: 1, foo: 2, ...bar };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path)).toBeNull();
  });
});
