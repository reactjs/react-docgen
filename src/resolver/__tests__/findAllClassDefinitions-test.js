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

describe('findAllClassDefinitions', () => {
  var findAllClassDefinitions;
  var recast;

  function parse(source) {
    return findAllClassDefinitions(
      recast.parse(source).program,
      recast
    );
  }

  beforeEach(() => {
    findAllClassDefinitions = require('../findAllClassDefinitions');
    recast = require('recast');
  });


  it('finds component classes', () => {
    var source = `
      import React from 'React';
      class ComponentA extends React.Component {}
      class ComponentB { render() {} }
      var ComponentC = class extends React.Component {}
      var ComponentD = class { render() {} }
      class NotAComponent {}
    `;

    var result = parse(source);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);
  });

  it('finds React.createClass, independent of the var name', () => {
    var source = `
      import R from 'React';
      class Component extends R.Component {};
    `;

    var result = parse(source);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });

  it('does not process X.createClass of other modules', () => {
    var source = `
      import R from 'FakeReact';
      class Component extends R.Component {};
    `;

    var result = parse(source);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

});
