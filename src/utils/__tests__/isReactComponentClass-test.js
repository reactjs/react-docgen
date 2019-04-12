/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('isReactComponentClass', () => {
  let isReactComponentClass;
  let expression, statement, parse;

  beforeEach(() => {
    isReactComponentClass = require('../isReactComponentClass').default;
    ({ expression, statement, parse } = require('../../../tests/utils'));
  });

  describe('render method', () => {
    it('accepts class declarations with a render method', () => {
      const def = statement('class Foo { render() {}}');
      expect(isReactComponentClass(def)).toBe(true);
    });

    it('accepts class expression with a render method', () => {
      const def = expression('class { render() {}}');
      expect(isReactComponentClass(def)).toBe(true);
    });

    it('ignores static render methods', () => {
      const def = statement('class Foo { static render() {}}');
      expect(isReactComponentClass(def)).toBe(false);
    });

    it('ignores dynamic render methods', () => {
      const def = statement('class Foo { static [render]() {}}');
      expect(isReactComponentClass(def)).toBe(false);
    });

    it('ignores getter or setter render methods', () => {
      let def = statement('class Foo { get render() {}}');
      expect(isReactComponentClass(def)).toBe(false);

      def = statement('class Foo { set render(value) {}}');
      expect(isReactComponentClass(def)).toBe(false);
    });
  });

  describe('JSDoc @extends React.Component', () => {
    it('accepts class declarations declaring `@extends React.Component` in JSDoc', () => {
      const def = parse(`
        var React = require('react');
        /**
         * @class Foo
         * @extends React.Component
         */
        class Foo extends Bar {}
      `).get('body', 1);

      expect(isReactComponentClass(def)).toBe(true);
    });
  });

  describe('React.Component inheritance', () => {
    it('accepts class declarations extending React.Component', () => {
      const def = parse(`
        var React = require('react');
        class Foo extends React.Component {}
      `).get('body', 1);

      expect(isReactComponentClass(def)).toBe(true);
    });

    it('accepts class expressions extending React.Component', () => {
      const def = parse(`
        var React = require('react');
        var Foo = class extends React.Component {}
      `).get('body', 1, 'declarations', 0, 'init');

      expect(isReactComponentClass(def)).toBe(true);
    });

    it('resolves the super class reference', () => {
      const def = parse(`
        var {Component} = require('react');
        var C = Component;
        class Foo extends C {}
      `).get('body', 2);

      expect(isReactComponentClass(def)).toBe(true);
    });

    it('does not accept references to other modules', () => {
      const def = parse(`
        var {Component} = require('FakeReact');
        class Foo extends Component {}
      `).get('body', 1);

      expect(isReactComponentClass(def)).toBe(false);
    });

    it('does not consider super class if render method is present', () => {
      const def = parse(`
        var {Component} = require('FakeReact');
        class Foo extends Component { render() {} }
      `).get('body', 1);

      expect(isReactComponentClass(def)).toBe(true);
    });
  });
});
