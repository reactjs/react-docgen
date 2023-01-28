import { NodePath } from '@babel/traverse';
import { parse, makeMockImporter, noopImporter } from '../../../tests/utils';
import FindAllDefinitionsResolver from '../FindAllDefinitionsResolver.js';
import { describe, expect, test } from 'vitest';

describe('FindAllDefinitionsResolver', () => {
  const resolver = new FindAllDefinitionsResolver();

  function findComponentsInSource(
    source: string,
    importer = noopImporter,
  ): NodePath[] {
    return resolver.resolve(parse(source, {}, importer, true));
  }

  const mockImporter = makeMockImporter({
    obj: (stmtLast) => stmtLast(`export default {};`).get('declaration'),

    reactComponent: (stmtLast) =>
      stmtLast(`
      import React from 'react';
      export default React.Component;
    `).get('declaration'),

    reactPureComponent: (stmtLast) =>
      stmtLast(`
      import React from 'react';
      export default React.PureComponent;
    `).get('declaration'),

    jsxDiv: (stmtLast) =>
      stmtLast(`export default <div />;`).get('declaration'),

    createElement: (stmtLast) =>
      stmtLast(`
      import React from 'react';
      export default React.createElement('div', null);
    `).get('declaration'),

    arrowJsx: (stmtLast) =>
      stmtLast(`export default (props) => <div>{props.children}</div>;`).get(
        'declaration',
      ),

    coloredView: (stmtLast) =>
      stmtLast(`export default function ColoredView(props, ref) {
        return <div ref={ref} style={{backgroundColor: props.color}} />
      };`).get('declaration'),
  });

  describe('React.createClass', () => {
    test('finds React.createClass', () => {
      const source = `
        var React = require("React");
        var Component = React.createClass({});
        module.exports = Component;
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0] instanceof NodePath).toBe(true);
      expect(result[0].node.type).toBe('ObjectExpression');
    });

    test('resolves imported values inside React.createClass', () => {
      const source = `
        import obj from 'obj';
        var React = require("React");
        var Component = React.createClass(obj);
        module.exports = Component;
      `;

      const result = findComponentsInSource(source, mockImporter);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0] instanceof NodePath).toBe(true);
      expect(result[0].node.type).toBe('ObjectExpression');
    });

    test('finds React.createClass, independent of the var name', () => {
      const source = `
        var R = require("React");
        var Component = R.createClass({});
        module.exports = Component;
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    test('does not process X.createClass of other modules', () => {
      const source = `
        var R = require("NoReact");
        var Component = R.createClass({});
        module.exports = Component;
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('finds assignments to exports', () => {
      const source = `
        var R = require("React");
        var Component = R.createClass({});
        exports.foo = 42;
        exports.Component = Component;
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    test('accepts multiple definitions', () => {
      let source = `
        var R = require("React");
        var ComponentA = R.createClass({});
        var ComponentB = R.createClass({});
        exports.ComponentB = ComponentB;
      `;

      let result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      source = `
        var R = require("React");
        var ComponentA = R.createClass({});
        var ComponentB = R.createClass({});
        module.exports = ComponentB;
      `;

      result = findComponentsInSource(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('class definitions', () => {
    test('finds component classes', () => {
      const source = `
        import React from 'React';
        class ComponentA extends React.Component {}
        class ComponentB extends Foo { render() {} }
        var ComponentC = class extends React.PureComponent {}
        var ComponentD = class extends Bar { render() {} }
        class NotAComponent {}
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
    });

    test('resolves extends React.Component/React.PureComponent from import', () => {
      const source = `
        import Component from 'reactComponent';
        import PureComponent from 'reactPureComponent';
        class ComponentA extends Component {}
        var ComponentC = class extends PureComponent {}
      `;

      const result = findComponentsInSource(source, mockImporter);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test('finds React.Component, independent of the var name', () => {
      const source = `
        import R from 'React';
        class Component extends R.Component {};
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    test('does not process X.Component of other modules', () => {
      const source = `
        import R from 'FakeReact';
        class Component extends R.Component {};
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('stateless components', () => {
    test('finds stateless components', () => {
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

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7);
    });

    test('resolve renders from imports', () => {
      const source = `
        import jsxDiv from 'jsxDiv';
        import createElement from 'createElement';
        import arrowJsx from 'arrowJsx';
        let ComponentA = () => jsxDiv;
        function ComponentB () { return createElement; }
        const ComponentC = function(props) { return arrowJsx(props); };
      `;

      const result = findComponentsInSource(source, mockImporter);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    test('finds React.createElement, independent of the var name', () => {
      const source = `
        import AlphaBetters from 'react';
        function ComponentA () { return AlphaBetters.createElement('div', null); }
        function ComponentB () { return 7; }
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    test('does not process X.createElement of other modules', () => {
      const source = `
        import R from 'FakeReact';
        const ComponentA = () => R.createElement('div', null);
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('forwardRef components', () => {
    test('finds forwardRef components', () => {
      const source = `
        import React from 'react';
        import PropTypes from 'prop-types';
        import extendStyles from 'enhancers/extendStyles';

        const ColoredView = React.forwardRef((props, ref) => (
          <div ref={ref} style={{backgroundColor: props.color}} />
        ));

        extendStyles(ColoredView);
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].node.type).toEqual('CallExpression');
    });

    test('finds none inline forwardRef components', () => {
      const source = `
        import React from 'react';
        import PropTypes from 'prop-types';
        import extendStyles from 'enhancers/extendStyles';

        function ColoredView(props, ref) {
          return <div ref={ref} style={{backgroundColor: props.color}} />
        }

        const ForwardedColoredView = React.forwardRef(ColoredView);
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].node.type).toEqual('CallExpression');
    });

    test('resolves imported component wrapped with forwardRef', () => {
      const source = `
        import React from 'react';
        import ColoredView from 'coloredView';
        const ForwardedColoredView = React.forwardRef(ColoredView);
      `;

      const result = findComponentsInSource(source, mockImporter);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].node.type).toEqual('CallExpression');
    });
  });

  describe('regressions', () => {
    test('finds component wrapped in HOC', () => {
      const source = `
        /**
         * @flow
         */
        import * as React from 'react';

        type Props = $ReadOnly<{|
          tabs: $ReadOnlyArray<string>,
        |}>;

        const TetraAdminTabs = React.memo<Props>((props: Props) => (
          <div></div>
        ));

        export default TetraAdminTabs;
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].node.type).toEqual('ArrowFunctionExpression');
    });
  });
});
