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

describe('findExportedClassDefinition', () => {
  var findExportedClassDefinition;
  var recast;

  function parse(source) {
    return findExportedClassDefinition(
      recast.parse(source).program,
      recast
    );
  }

  beforeEach(() => {
    findExportedClassDefinition =
      require('../findExportedClassDefinition');
    recast = require('recast');
  });

  describe('CommonJS module exports', () => {
    it('finds class declarations', () => {
      var source = `
        var React = require("React");
        class Component extends React.Component {}
        module.exports = Component;
      `;

      var result = parse(source);
      expect(result).toBeDefined();
      expect(result.node.type).toBe('ClassDeclaration');
    });

    it('finds class expression', () => {
      var source = `
        var React = require("React");
        var Component = class extends React.Component {}
        module.exports = Component;
      `;

      var result = parse(source);
      expect(result).toBeDefined();
      expect(result.node.type).toBe('ClassExpression');
    });

    it('finds class definition, independent of the var name', () => {
      var source = `
        var R = require("React");
        class Component extends R.Component {}
        module.exports = Component;
      `;

      var result = parse(source);
      expect(result).toBeDefined();
      expect(result.node.type).toBe('ClassDeclaration');
    });

    describe('module.exports = <C>; / exports.foo = <C>;', () => {

      it('finds assignments to exports', () => {
        var source = `
          var R = require("React");
          class Component extends R.Component {}
          exports.foo = 42;
          exports.Component = Component;
        `;

        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

      it('errors if multiple components are exported', () => {
        var source = `
          var R = require("React");
          class ComponentA extends R.Component {}
          class ComponentB extends R.Component {}
          exports.ComponentA = ComponentA;
          exports.ComponentB = ComponentB;
        `;

        expect(() => parse(source)).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        var source = `
          var R = require("React");
          class ComponentA extends R.Component {}
          class ComponentB extends R.Component {}
          exports.ComponentB = ComponentB;
        `;

        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');

        source = `
          var R = require("React");
          class ComponentA extends R.Component {}
          class ComponentB extends R.Component {}
          module.exports = ComponentB;
        `;

        result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

    });
  });

  describe('ES6 export declarations', () => {

    describe('export default <component>;', () => {

      it('finds default export', () => {
        var source = `
          import React from 'React';
          class Component extends React.Component {}
          export default Component;
        `;

        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');

        source = `
          import React from 'React';
          export default class Component extends React.Component {};
        `;

        result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

      it('errors if multiple components are exported', () => {
        var source = `
          import React from 'React';
          export var Component = class extends React.Component {};
          export default class ComponentB extends React.Component{};
        `;
        expect(() => parse(source)).toThrow();

        var source = `
          import React from 'React';
          var Component = class extends React.Component {};
          export {Component};
          export default class ComponentB extends React.Component{};
        `;
        expect(() => parse(source)).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        var source = `
          import React from 'React';
          var Component = class extends React.Component {};
          export default class ComponentB extends React.Component{};
        `;

        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

    });

    describe('export var foo = <C>, ...;', () => {

      it('finds named exports', () => {
        var source = `
          import React from 'React';
          export var somethingElse = 42,
            Component = class extends React.Component {};
        `;
        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');

        source = `
          import React from 'React';
          export let Component = class extends React.Component {},
            somethingElse = 42;
        `;
        result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');

        source = `
          import React from 'React';
          export const something = 21,
            Component = class extends React.Component {},
            somethingElse = 42;
        `;
        result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');

        source = `
          import React from 'React';
          export var somethingElse = function() {};
          export let Component  = class extends React.Component {};
        `;
        result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');
      });

      it('errors if multiple components are exported', () => {
        var source = `
          import React from 'React';
          export var ComponentA  = class extends React.Component {};
          export var ComponentB  = class extends React.Component {};
        `;
        expect(() => parse(source)).toThrow();

        var source = `
          import React from 'React';
          export var ComponentA = class extends React.Component {};
          var ComponentB  = class extends React.Component {};
          export {ComponentB};
        `;
        expect(() => parse(source)).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        var source = `
          import React from 'React';
          var ComponentA  = class extends React.Component {}
          export var ComponentB = class extends React.Component {};
        `;
        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');
      });

    });

    describe('export {<C>};', () => {

      it('finds exported specifiers', () => {
        var source = `
          import React from 'React';
          var foo = 42;
          var Component = class extends React.Component {};
          export {foo, Component};
        `;
        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');

        source = `
          import React from 'React';
          var foo = 42;
          var Component = class extends React.Component {};
          export {Component, foo};
        `;
        result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');

        source = `
          import React from 'React';
          var foo = 42;
          var baz = 21;
          var Component = class extends React.Component {};
          export {foo, Component as bar, baz};
        `;
        result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');
      });

      it('errors if multiple components are exported', () => {
        var source = `
          import React from 'React';
          var ComponentA = class extends React.Component {};
          var ComponentB = class extends React.Component {};
          export {ComponentA as foo, ComponentB};
        `;

        expect(() => parse(source)).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        var source = `
          import React from 'React';
          var ComponentA = class extends React.Component {};
          var ComponentB = class extends React.Component {};
          export {ComponentA};
        `;
        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');
      });

    });

    describe('export <C>;', () => {

      it('finds named exports', () => {
        var source = `
          import React from 'React';
          export var foo = 42;
          export class Component extends React.Component {};
        `;
        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

      it('errors if multiple components are exported', () => {
        var source = `
          import React from 'React';
          export class ComponentA extends React.Component {};
          export class ComponentB extends React.Component {};
        `;

        expect(() => parse(source)).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        var source = `
          import React from 'React';
          class ComponentA extends React.Component {};
          export class ComponentB extends React.Component {};
        `;
        var result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

    });
  });
});
