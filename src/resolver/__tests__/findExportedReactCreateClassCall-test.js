/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

"use strict";

jest.autoMockOff();

describe('React documentation parser', () => {
  var findExportedReactCreateClass;
  var recast;

  function parse(source) {
    return findExportedReactCreateClass(
      recast.parse(source).program,
      recast
    );
  }

  beforeEach(() => {
    findExportedReactCreateClass =
      require('../findExportedReactCreateClassCall');
    recast = require('recast');
  });

  describe('CommonJS module exports', () => {
    it('finds React.createClass', () => {
      var source = [
        'var React = require("React");',
        'var Component = React.createClass({});',
        'module.exports = Component;'
      ].join('\n');

      expect(parse(source)).toBeDefined();
    });

    it('finds React.createClass, independent of the var name', () => {
      var source = [
        'var R = require("React");',
        'var Component = R.createClass({});',
        'module.exports = Component;'
      ].join('\n');

      expect(parse(source)).toBeDefined();
    });

    it('does not process X.createClass of other modules', () => {
      var source = [
        'var R = require("NoReact");',
        'var Component = R.createClass({});',
        'module.exports = Component;'
      ].join('\n');

      expect(parse(source)).toBeUndefined();
    });

    describe('module.exports = <C>; / exports.foo = <C>;', () => {

      it('finds assignments to exports', () => {
        var source = [
          'var R = require("React");',
          'var Component = R.createClass({});',
          'exports.foo = 42;',
          'exports.Component = Component;'
        ].join('\n');

        expect(parse(source)).toBeDefined();
      });

      it('errors if multiple components are exported', () => {
        var source = [
          'var R = require("React");',
          'var ComponentA = R.createClass({});',
          'var ComponentB = R.createClass({});',
          'exports.ComponentA = ComponentA;',
          'exports.ComponentB = ComponentB;'
        ].join('\n');

        expect(function() {
          parse(source)
        }).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        var source = [
          'var R = require("React");',
          'var ComponentA = R.createClass({});',
          'var ComponentB = R.createClass({});',
          'exports.ComponentB = ComponentB;'
        ].join('\n');

        expect(parse(source)).toBeDefined();

        source = [
          'var R = require("React");',
          'var ComponentA = R.createClass({});',
          'var ComponentB = R.createClass({});',
          'module.exports = ComponentB;'
        ].join('\n');

        expect(parse(source)).toBeDefined();
      });

    });
  });

  describe('ES6 export declarations', () => {

    describe('export default <component>;', () => {

      it('finds default export', () => {
        var source = [
          'var React = require("React");',
          'var Component = React.createClass({});',
          'export default Component'
        ].join('\n');

        expect(parse(source)).toBeDefined();

        source = [
          'var React = require("React");',
          'export default React.createClass({});'
        ].join('\n');

        expect(parse(source)).toBeDefined();
      });

      it('errors if multiple components are exported', () => {
        var source = [
          'import React, { createElement } from "React"',
          'export var Component = React.createClass({})',
          'export default React.createClass({});'
        ].join('\n');
        expect(() => parse(source)).toThrow();

        source = [
          'import React, { createElement } from "React"',
          'var Component = React.createClass({})',
          'export {Component};',
          'export default React.createClass({});'
        ].join('\n');
        expect(() => parse(source)).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        var source = [
          'import React, { createElement } from "React"',
          'var Component = React.createClass({})',
          'export default React.createClass({});'
        ].join('\n');

        expect(parse(source)).toBeDefined();
      });

    });

    describe('export var foo = <C>, ...;', () => {

      it('finds named exports', () => {
        var source = [
          'var React = require("React");',
          'export var somethingElse = 42, Component = React.createClass({});'
        ].join('\n');
        expect(parse(source)).toBeDefined();

        source = [
          'var React = require("React");',
          'export let Component = React.createClass({}), somethingElse = 42;'
        ].join('\n');
        expect(parse(source)).toBeDefined();

        source = [
          'var React = require("React");',
          'export const something = 21,',
          ' Component = React.createClass({}),',
          ' somethingElse = 42;',
        ].join('\n');
        expect(parse(source)).toBeDefined();

        source = [
          'var React = require("React");',
          'export var somethingElse = function() {};',
          'export let Component = React.createClass({});',
        ].join('\n');
        expect(parse(source)).toBeDefined();
      });

      it('errors if multiple components are exported', () => {
        var source = [
          'var R = require("React");',
          'export var ComponentA = R.createClass({}),',
          '  ComponentB = R.createClass({});',
        ].join('\n');

        expect(function() {
          parse(source)
        }).toThrow();

        source = [
          'var R = require("React");',
          'export var ComponentA = R.createClass({}),',
          'var ComponentB = R.createClass({});',
          'export {ComponentB};',
        ].join('\n');

        expect(function() {
          parse(source)
        }).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        var source = [
          'var R = require("React");',
          'var ComponentA = R.createClass({});',
          'export let ComponentB = R.createClass({});',
        ].join('\n');

        expect(parse(source)).toBeDefined();
      });

    });

    describe('export {<C>};', () => {

      it('finds exported specifiers', () => {
        var source = [
          'var React = require("React");',
          'var foo = 42;',
          'var Component = React.createClass({});',
          'export {foo, Component}'
        ].join('\n');
        expect(parse(source)).toBeDefined();

        source = [
          'import React from "React"',
          'var React = require("React");',
          'var Component = React.createClass({});',
          'export {Component, foo}'
        ].join('\n');
        expect(parse(source)).toBeDefined();

        source = [
          'import React, { createElement } from "React"',
          'var foo = 42;',
          'var baz = 21;',
          'var Component = React.createClass({});',
          'export {foo, Component as bar, baz}'
        ].join('\n');
        expect(parse(source)).toBeDefined();
      });

      it('errors if multiple components are exported', () => {
        var source = [
          'var R = require("React");',
          'var ComponentA = R.createClass({}),',
          'var ComponentB = R.createClass({});',
          'export {ComponentA as foo, ComponentB};'
        ].join('\n');

        expect(function() {
          parse(source)
        }).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        var source = [
          'var R = require("React");',
          'var ComponentA = R.createClass({});',
          'var ComponentB = R.createClass({});',
          'export {ComponentA}',
        ].join('\n');

        expect(parse(source)).toBeDefined();
      });

    });

  });
});
