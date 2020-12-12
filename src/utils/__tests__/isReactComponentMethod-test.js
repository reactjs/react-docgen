/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  expression,
  statement,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';
import isReactComponentMethod from '../isReactComponentMethod';

describe('isReactComponentMethod', () => {
  const mockImporter = makeMockImporter({
    foo: statement(`
      export default 'render';
    `).get('declaration'),
  });

  it('returns true if the method is a component class method', () => {
    const def = statement('class Foo { render() {}}');
    const method = def.get('body', 'body', 0);
    expect(isReactComponentMethod(method, noopImporter)).toBe(true);
  });

  it('returns true if the method is a component `createClass` object method', () => {
    const def = expression('{ render() {}}');
    const method = def.get('properties', 0);
    expect(isReactComponentMethod(method, noopImporter)).toBe(true);
  });

  it('returns false if the method is not a component class method', () => {
    const def = statement('class Foo { bar() {}}');
    const method = def.get('body', 'body', 0);
    expect(isReactComponentMethod(method, noopImporter)).toBe(false);
  });

  it('returns false if the method is not a component `createClass` object method', () => {
    const def = expression('{ bar() {}}');
    const method = def.get('properties', 0);
    expect(isReactComponentMethod(method, noopImporter)).toBe(false);
  });

  it('returns false if the path is not a method or object property', () => {
    const def = statement('let foo = "bar";');
    expect(isReactComponentMethod(def, noopImporter)).toBe(false);
  });

  it('resolves imported value of computed property', () => {
    const def = statement(`
      class Foo { [foo]() {}}
      import foo from 'foo';
    `);
    const method = def.get('body', 'body', 0);
    expect(isReactComponentMethod(method, mockImporter)).toBe(true);
  });
});
