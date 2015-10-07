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

describe('isStatelessComponent', () => {
  var isStatelessComponent;
  var expression, statement, parse;

  beforeEach(() => {
    isStatelessComponent = require('../isStatelessComponent');
    ({expression, statement, parse} = require('../../../tests/utils'));
  });

  describe('Stateless Function Components with JSX', () => {
    it('accepts simple arrow function components', () => {
      var def = parse(
        'var Foo = () => <div />'
      ).get('body', 0).get('declarations', [0]).get('init');
      expect(isStatelessComponent(def)).toBe(true);
    });

    it('accepts simple function expressions components', () => {
      var def = parse(
        'let Foo = function() { return <div />; };'
      ).get('body', 0).get('declarations', [0]).get('init');
      expect(isStatelessComponent(def)).toBe(true);
    });

    it('accepts simple function declaration components', () => {
      var def = parse('function Foo () { return <div /> }').get('body', 0);
      expect(isStatelessComponent(def)).toBe(true);
    });
  });

  describe('Stateless Function Components with React.createElement', () => {
    it('accepts simple arrow function components', () => {
      var def = parse(`
        var AlphaBetters = require('react');
        var Foo = () => AlphaBetters.createElement("div", null);
      `).get('body', 1).get('declarations', [0]).get('init');

      expect(isStatelessComponent(def)).toBe(true);
    });

    it('accepts simple function expressions components', () => {
      var def = parse(`
        var React = require('react');
        let Foo = function() { return React.createElement("div", null); };
      `).get('body', 1).get('declarations', [0]).get('init');

      expect(isStatelessComponent(def)).toBe(true);
    });

    it('accepts simple function declaration components', () => {
      var def = parse(`
        var React = require('react');
        function Foo () { return React.createElement("div", null); }
      `).get('body', 1);
      expect(isStatelessComponent(def)).toBe(true);
    });
  });

  describe('Stateless Function Components inside module pattern', () => {
    it('', () => {
      var def = parse(`
        var React = require('react');
        var Foo = {
          Bar() { return <div />; },
          Baz: function() { return React.createElement('div'); },
          ['hello']: function() { return React.createElement('div'); },
          render() { return 7; }
        }
      `).get('body', 1).get('declarations', 0).get('init');

      var bar = def.get('properties', 0);
      var baz = def.get('properties', 1);
      var hello = def.get('properties', 2);
      var render = def.get('properties', 3);

      expect(isStatelessComponent(bar)).toBe(true);
      expect(isStatelessComponent(baz)).toBe(true);
      expect(isStatelessComponent(hello)).toBe(true);
      expect(isStatelessComponent(render)).toBe(false);
    });
  });

  describe('is not overzealous', () => {
    it('does not accept declarations with a render method', () => {
      var def = statement(`
        class Foo {
          render() {
            return <div />;
          }
        }
      `);
      expect(isStatelessComponent(def)).toBe(false);
    });

    it('does not accept React.Component classes', () => {
      var def = parse(`
        var React = require('react');
        class Foo extends React.Component {
          render() {
            return <div />;
          }
        }
      `).get('body', 1);

      expect(isStatelessComponent(def)).toBe(false);
    });

    it('does not accept React.createClass calls', () => {
      var def = statement(`
        React.createClass({
          render() {
            return <div />;
          }
        });
      `);
      expect(isStatelessComponent(def)).toBe(false);
    });
  });
});

