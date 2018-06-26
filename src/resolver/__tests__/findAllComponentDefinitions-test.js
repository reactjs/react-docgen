/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global describe, it, expect*/

import recast from 'recast';
import * as utils from '../../../tests/utils';
import findAllComponentDefinitions from '../findAllComponentDefinitions';

describe('findAllComponentDefinitions', () => {
  function parse(source) {
    return findAllComponentDefinitions(utils.parse(source, recast), recast);
  }

  describe('React.createClass', () => {
    it('finds React.createClass', () => {
      const source = `
        var React = require("React");
        var Component = React.createClass({});
        module.exports = Component;
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0] instanceof recast.types.NodePath).toBe(true);
      expect(result[0].node.type).toBe('ObjectExpression');
    });

    it('finds React.createClass, independent of the var name', () => {
      const source = `
        var R = require("React");
        var Component = R.createClass({});
        module.exports = Component;
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('does not process X.createClass of other modules', () => {
      const source = `
        var R = require("NoReact");
        var Component = R.createClass({});
        module.exports = Component;
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('finds assignments to exports', () => {
      const source = `
        var R = require("React");
        var Component = R.createClass({});
        exports.foo = 42;
        exports.Component = Component;
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('accepts multiple definitions', () => {
      let source = `
        var R = require("React");
        var ComponentA = R.createClass({});
        var ComponentB = R.createClass({});
        exports.ComponentB = ComponentB;
      `;

      let result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      source = `
        var R = require("React");
        var ComponentA = R.createClass({});
        var ComponentB = R.createClass({});
        module.exports = ComponentB;
      `;

      result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('class definitions', () => {
    it('finds component classes', () => {
      const source = `
        import React from 'React';
        class ComponentA extends React.Component {}
        class ComponentB { render() {} }
        var ComponentC = class extends React.Component {}
        var ComponentD = class { render() {} }
        class NotAComponent {}
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
    });

    it('finds React.createClass, independent of the var name', () => {
      const source = `
        import R from 'React';
        class Component extends R.Component {};
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('does not process X.createClass of other modules', () => {
      const source = `
        import R from 'FakeReact';
        class Component extends R.Component {};
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('stateless components', () => {
    it('finds stateless components', () => {
      const source = `
        import React from 'React';
        let ComponentA = () => <div />;
        function ComponentB () { return React.createElement('div', null); }
        const ComponentC = function(props) { return <div>{props.children}</div>; };
        var Obj = {
          component() { if (true) { return <div />; } }
        };
        const ComponentD = function(props) {
          var result = <div>{props.children}</div>;
          return result;
        };
        const ComponentE = function(props) {
          var result = () => <div>{props.children}</div>;
          return result();
        };
        const ComponentF = function(props) {
          var helpers = {
            comp() { return <div>{props.children}</div>; }
          };
          return helpers.comp();
        };
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7);
    });

    it('finds React.createElement, independent of the var name', () => {
      const source = `
        import AlphaBetters from 'react';
        function ComponentA () { return AlphaBetters.createElement('div', null); }
        function ComponentB () { return 7; }
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('does not process X.createClass of other modules', () => {
      const source = `
        import R from 'FakeReact';
        const ComponentA = () => R.createElement('div', null);
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
