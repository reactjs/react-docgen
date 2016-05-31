/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/


jest.disableAutomock();

describe('isReactComponentMethod', () => {
  let isReactComponentMethod;
  let expression, statement;

  beforeEach(() => {
    isReactComponentMethod = require('../isReactComponentMethod').default;
    ({expression, statement} = require('../../../tests/utils'));
  });

  it('returns true if the method is a component class method', () => {
    const def = statement('class Foo { render() {}}');
    const method = def.get('body', 'body', 0);
    expect(isReactComponentMethod(method)).toBe(true);
  });

  it('returns true if the method is a component `createClass` object method', () => {
    const def = expression('{ render() {}}');
    const method = def.get('properties', 0);
    expect(isReactComponentMethod(method)).toBe(true);
  });

  it('returns false if the method is not a component class method', () => {
    const def = statement('class Foo { bar() {}}');
    const method = def.get('body', 'body', 0);
    expect(isReactComponentMethod(method)).toBe(false);
  });

  it('returns false if the method is not a component `createClass` object method', () => {
    const def = expression('{ bar() {}}');
    const method = def.get('properties', 0);
    expect(isReactComponentMethod(method)).toBe(false);
  });

  it('returns false if the path is not a method or object property', () => {
    const def = statement('let foo = "bar";');
    expect(isReactComponentMethod(def)).toBe(false);
  });
});
