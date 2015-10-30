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

describe('findExportedComponentDefinition', () => {
  var findExportedComponentDefinition;
  var utils;
  var recast;

  function parse(source) {
    return findExportedComponentDefinition(
      utils.parse(source),
      recast
    );
  }

  beforeEach(() => {
    findExportedComponentDefinition =
      require('../findExportedComponentDefinition');
    utils = require('../../../tests/utils');
    recast = require('recast');
  });

  describe('CommonJS module exports', () => {

    describe('React.createClass', () => {

      it('finds React.createClass', () => {
        var source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = Component;
        `;

        expect(parse(source)).toBeDefined();
      });

      it('finds React.createClass, independent of the var name', () => {
        var source = `
          var R = require("React");
          var Component = R.createClass({});
          module.exports = Component;
        `;

        expect(parse(source)).toBeDefined();
      });

      it('does not process X.createClass of other modules', () => {
        var source = `
          var R = require("NoReact");
          var Component = R.createClass({});
          module.exports = Component;
        `;

        expect(parse(source)).toBeUndefined();
      });

    });

    describe('class definitions', () => {

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
    });

    describe('stateless components', () => {

      it('finds stateless component with JSX', () => {
        var source = `
          var React = require("React");
          var Component = () => <div />;
          module.exports = Component;
        `;

        expect(parse(source)).toBeDefined();
      });

      it('finds stateless components with React.createElement, independent of the var name', () => {
        var source = `
          var R = require("React");
          var Component = () => R.createElement('div', {});
          module.exports = Component;
        `;

        expect(parse(source)).toBeDefined();
      });

      it('does not process X.createElement of other modules', () => {
        var source = `
          var R = require("NoReact");
          var Component = () => R.createElement({});
          module.exports = Component;
        `;

        expect(parse(source)).toBeUndefined();
      });

    });

    describe('module.exports = <C>; / exports.foo = <C>;', () => {

      describe('React.createClass', () => {

        it('finds assignments to exports', () => {
          var source = `
            var R = require("React");
            var Component = R.createClass({});
            exports.foo = 42;
            exports.Component = Component;
          `;

          expect(parse(source)).toBeDefined();
        });

        it('errors if multiple components are exported', () => {
          var source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          var source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentB = ComponentB;
          `;

          expect(parse(source)).toBeDefined();

          source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            module.exports = ComponentB;
          `;

          expect(parse(source)).toBeDefined();
        });

      });

      describe('class definition', () => {
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
  });

  describe('ES6 export declarations', () => {

    describe('export default <component>;', () => {

      describe('React.createClass', () => {

        it('finds default export', () => {
          var source = `
            var React = require("React");
            var Component = React.createClass({});
            export default Component
          `;

          expect(parse(source)).toBeDefined();

          source = `
            var React = require("React");
            export default React.createClass({});
          `;

          expect(parse(source)).toBeDefined();
        });

        it('errors if multiple components are exported', () => {
          var source = `
            import React, { createElement } from "React"
            export var Component = React.createClass({})
            export default React.createClass({});
          `;
          expect(() => parse(source)).toThrow();

          source = `
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export {Component};
            export default React.createClass({});
          `;
          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          var source = `
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export default React.createClass({});
          `;

          expect(parse(source)).toBeDefined();
        });

      });

      describe('class definition', () => {

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

          source = `
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

    });

    describe('export var foo = <C>, ...;', () => {

      describe('React.createClass', () => {

        it('finds named exports', () => {
          var source = `
            var React = require("React");
            export var somethingElse = 42, Component = React.createClass({});
          `;
          expect(parse(source)).toBeDefined();

          source = `
            var React = require("React");
            export let Component = React.createClass({}), somethingElse = 42;
          `;
          expect(parse(source)).toBeDefined();

          source = `
            var React = require("React");
            export const something = 21,
             Component = React.createClass({}),
             somethingElse = 42;
          `;
          expect(parse(source)).toBeDefined();

          source = `
            var React = require("React");
            export var somethingElse = function() {};
            export let Component = React.createClass({});
          `;
          expect(parse(source)).toBeDefined();
        });

        it('errors if multiple components are exported', () => {
          var source = `
            var R = require("React");
            export var ComponentA = R.createClass({}),
              ComponentB = R.createClass({});
          `;

          expect(() => parse(source)).toThrow();

          source = `
            var R = require("React");
            export var ComponentA = R.createClass({}),
            var ComponentB = R.createClass({});
            export {ComponentB};
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          var source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            export let ComponentB = R.createClass({});
          `;

          expect(parse(source)).toBeDefined();
        });

      });

      describe('class definition', () => {

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

          source = `
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

      describe.only('stateless components', () => {

        it('finds named exports', () => {
          var source = `
            import React from 'React';
            export var somethingElse = 42,
              Component = () => <div />;
          `;
          var result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');

          source = `
            import React from 'React';
            export let Component = () => <div />,
              somethingElse = 42;
          `;
          result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');

          source = `
            import React from 'React';
            export const something = 21,
              Component = () => <div />,
              somethingElse = 42;
          `;
          result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');

          source = `
            import React from 'React';
            export var somethingElse = function() {};
            export let Component = () => <div />
          `;
          result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');
        });

        it('errors if multiple components are exported', () => {
          var source = `
            import React from 'React';
            export var ComponentA = () => <div />
            export var ComponentB = () => <div />
          `;
          expect(() => parse(source)).toThrow();

          source = `
            import React from 'React';
            export var ComponentA = () => <div />
            var ComponentB  = () => <div />
            export {ComponentB};
          `;
          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          var source = `
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = function() { return <div />; };
          `;
          var result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('FunctionExpression');
        });
      });
    });

    describe('export {<C>};', () => {

      describe('React.createClass', () => {

        it('finds exported specifiers', () => {
          var source = `
            var React = require("React");
            var foo = 42;
            var Component = React.createClass({});
            export {foo, Component}
          `;
          expect(parse(source)).toBeDefined();

          source = `
            import React from "React"
            var React = require("React");
            var Component = React.createClass({});
            export {Component, foo}
          `;
          expect(parse(source)).toBeDefined();

          source = `
            import React, { createElement } from "React"
            var foo = 42;
            var baz = 21;
            var Component = React.createClass({});
            export {foo, Component as bar, baz}
          `;
          expect(parse(source)).toBeDefined();
        });

        it('errors if multiple components are exported', () => {
          var source = `
            var R = require("React");
            var ComponentA = R.createClass({}),
            var ComponentB = R.createClass({});
            export {ComponentA as foo, ComponentB};
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          var source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA}
          `;

          expect(parse(source)).toBeDefined();
        });

      });

      describe('class definition', () => {

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

      describe('stateless components', () => {

        it('finds exported specifiers', () => {
          var source = `
            import React from 'React';
            var foo = 42;
            function Component = () { return <div />; }
            export {foo, Component};
          `;
          var result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassExpression');

          source = `
            import React from 'React';
            var foo = 42;
            var Component = () => <div />;
            export {Component, foo};
          `;
          result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassExpression');

          source = `
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = function () { return <div />; }
            export {foo, Component as bar, baz};
          `;
          result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassExpression');
        });

        it('errors if multiple components are exported', () => {
          var source = `
            import React from 'React';
            var ComponentA = () => <div />;
            function ComponentB() { return <div />; }
            export {ComponentA as foo, ComponentB};
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          var source = `
            import React from 'React';
            var ComponentA = () => <div />;
            var ComponentB = () => <div />;
            export {ComponentA};
          `;
          var result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');
        });

      });
    });

    // Only applies to classes
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
