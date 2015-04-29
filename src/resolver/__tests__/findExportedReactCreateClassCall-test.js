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

  it('finds React.createClass in default exported', () => {
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

  it('finds React.createClass in variable exported', () => {
    var source = [
      'var React = require("React");',
      'export var Component = React.createClass({});'
    ].join('\n');

    expect(parse(source)).toBeDefined();
  });

});
