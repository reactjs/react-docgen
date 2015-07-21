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


jest.autoMockOff();

describe('isReactComponentClass', () => {
  var isReactComponentClass;
  var expression, statement, parse;

  beforeEach(() => {
    isReactComponentClass = require('../isReactComponentClass');
    ({expression, statement, parse} = require('../../../tests/utils'));
  });

  describe('render method', () => {
    it('accepts class declarations with a render method', () => {
      var def = statement('class Foo { render() {}}');
      expect(isReactComponentClass(def)).toBe(true);
    });

    it('accepts class expression with a render method', () => {
      var def = expression('class { render() {}}');
      expect(isReactComponentClass(def)).toBe(true);
    });

    it('ignores static render methods', () => {
      var def = statement('class Foo { static render() {}}');
      expect(isReactComponentClass(def)).toBe(false);
    });

    it('ignores dynamic render methods', () => {
      var def = statement('class Foo { static [render]() {}}');
      expect(isReactComponentClass(def)).toBe(false);
    });

    it('ignores getter or setter render methods', () => {
      var def = statement('class Foo { get render() {}}');
      expect(isReactComponentClass(def)).toBe(false);

      def = statement('class Foo { set render(value) {}}');
      expect(isReactComponentClass(def)).toBe(false);
    });
  });

  describe('React.Component inheritance', () => {
    it('accepts class declarations extending React.Component', () => {
      var def = parse(`
        var React = require('react');
        class Foo extends React.Component {}
      `).get('body', 1);

      expect(isReactComponentClass(def)).toBe(true);
    });

    it('accepts class expressions extending React.Component', () => {
      var def = parse(`
        var React = require('react');
        var Foo = class extends React.Component {}
      `).get('body', 1, 'declarations', 0, 'init');

      expect(isReactComponentClass(def)).toBe(true);
    });

    it('resolves the super class reference', () => {
      var def = parse(`
        var {Component} = require('react');
        var C = Component;
        class Foo extends C {}
      `).get('body', 2);

      expect(isReactComponentClass(def)).toBe(true);
    });

    it('does not accept references to other modules', () => {
      var def = parse(`
        var {Component} = require('FakeReact');
        class Foo extends Component {}
      `).get('body', 1);

      expect(isReactComponentClass(def)).toBe(false);
    });

    it('does not consider super class if render method is present', () => {
      var def = parse(`
        var {Component} = require('FakeReact');
        class Foo extends Component { render() {} }
      `).get('body', 1);

      expect(isReactComponentClass(def)).toBe(true);
    });
  });

});
