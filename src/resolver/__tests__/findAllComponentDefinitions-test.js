/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NodePath } from 'ast-types';
import * as utils from '../../../tests/utils';
import findAllComponentDefinitions from '../findAllComponentDefinitions';

describe('findAllComponentDefinitions', () => {
  function parse(source, importer = utils.noopImporter) {
    return findAllComponentDefinitions(
      utils.parse(source),
      utils.getParser(),
      importer,
    );
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
      expect(result[0] instanceof NodePath).toBe(true);
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
        class ComponentB extends Foo { render() {} }
        var ComponentC = class extends React.PureComponent {}
        var ComponentD = class extends Bar { render() {} }
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

  describe('forwardRef components', () => {
    it('finds forwardRef components', () => {
      const source = `
        import React from 'react';
        import PropTypes from 'prop-types';
        import extendStyles from 'enhancers/extendStyles';

        const ColoredView = React.forwardRef((props, ref) => (
          <div ref={ref} style={{backgroundColor: props.color}} />
        ));

        extendStyles(ColoredView);
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].value.type).toEqual('CallExpression');
    });

    it('finds none inline forwardRef components', () => {
      const source = `
        import React from 'react';
        import PropTypes from 'prop-types';
        import extendStyles from 'enhancers/extendStyles';

        function ColoredView(props, ref) {
          return <div ref={ref} style={{backgroundColor: props.color}} />
        }

        const ForwardedColoredView = React.forwardRef(ColoredView);
      `;

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].value.type).toEqual('CallExpression');
    });
  });

  describe('regressions', () => {
    it('finds component wrapped in HOC', () => {
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

      const result = parse(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].value.type).toEqual('ArrowFunctionExpression');
    });
  });
});
