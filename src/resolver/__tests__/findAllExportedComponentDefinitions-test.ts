import { NodePath } from 'ast-types/lib/node-path';
import {
  getParser,
  parse,
  statement,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';
import { Importer } from '../../parse';

import findAllExportedComponentDefinitions from '../findAllExportedComponentDefinitions';

describe('findAllExportedComponentDefinitions', () => {
  function findComponents(
    path: NodePath,
    importer: Importer = noopImporter,
  ): NodePath[] {
    return findAllExportedComponentDefinitions(
      path.node,
      getParser(),
      importer,
    );
  }

  const mockImporter = makeMockImporter({
    createClass: statement(`
      export default React.createClass({});
      import React from 'react';
    `).get('declaration'),

    classDec: statement(`
      export default class Component extends React.Component {};
      import React from 'react';
    `).get('declaration'),

    classExpr: statement(`
      export default Component;
      var Component = class extends React.Component {};
      import React from 'react';
    `).get('declaration'),

    statelessJsx: statement(`
      export default () => <div />;
    `).get('declaration'),

    statelessCreateElement: statement(`
      export default () => React.createElement('div', {});
      import React from 'react';
    `).get('declaration'),

    forwardRef: statement(`
      export default React.forwardRef((props, ref) => (
        <div ref={ref} style={{backgroundColor: props.color}} />
      ));
      import React from 'react';
    `).get('declaration'),
  });

  describe('CommonJS module exports', () => {
    describe('React.createClass', () => {
      it('finds React.createClass', () => {
        const parsed = parse(`
          var React = require("React");
          var Component = React.createClass({});
          module.exports = Component;
        `);
        const actual = findComponents(parsed);
        const expected = parsed.get(
          'body',
          1,
          'declarations',
          0,
          'init',
          'arguments',
          0,
        );

        expect(actual.length).toBe(1);
        expect(actual[0].node).toBe(expected.node);
      });

      it('finds React.createClass, independent of the var name', () => {
        const parsed = parse(`
          var R = require("React");
          var Component = R.createClass({});
          module.exports = Component;
        `);
        const actual = findComponents(parsed);

        expect(actual.length).toBe(1);
      });

      it('does not process X.createClass of other modules', () => {
        const parsed = parse(`
          var R = require("NoReact");
          var Component = R.createClass({});
          module.exports = Component;
        `);
        const actual = findComponents(parsed);

        expect(actual.length).toBe(0);
      });

      it('resolves an imported variable to React.createClass', () => {
        const parsed = parse(`
          import Component from 'createClass';
          module.exports = Component;
        `);
        const actual = findComponents(parsed, mockImporter);

        expect(actual.length).toBe(1);
      });
    });

    describe('class definitions', () => {
      it('finds class declarations', () => {
        const parsed = parse(`
          var React = require("React");
          class Component extends React.Component {}
          module.exports = Component;
        `);
        const actual = findComponents(parsed);
        const expected = parsed.get('body', 1);

        expect(actual.length).toBe(1);
        expect(actual[0].node).toBe(expected.node);
      });

      it('finds class expression', () => {
        const parsed = parse(`
          var React = require("React");
          var Component = class extends React.Component {}
          module.exports = Component;
        `);
        const actual = findComponents(parsed);

        expect(actual.length).toBe(1);
      });

      it('finds class definition, independent of the var name', () => {
        const parsed = parse(`
          var R = require("React");
          class Component extends R.Component {}
          module.exports = Component;
        `);
        const actual = findComponents(parsed);

        expect(actual.length).toBe(1);
      });

      it('resolves an imported variable to class declaration', () => {
        const parsed = parse(`
          import Component from 'classDec';
          module.exports = Component;
        `);
        const actual = findComponents(parsed, mockImporter);

        expect(actual.length).toBe(1);
      });

      it('resolves an imported variable to class expression', () => {
        const parsed = parse(`
          import Component from 'classExpr';
          module.exports = Component;
        `);
        const actual = findComponents(parsed, mockImporter);

        expect(actual.length).toBe(1);
      });
    });

    describe('stateless components', () => {
      it('finds stateless component with JSX', () => {
        const parsed = parse(`
          var React = require("React");
          var Component = () => <div />;
          module.exports = Component;
        `);
        const actual = findComponents(parsed);
        const expected = parsed.get('body', 1, 'declarations', 0, 'init');

        expect(actual.length).toBe(1);
        expect(actual[0].node).toBe(expected.node);
      });

      it('finds stateless components with React.createElement, independent of the var name', () => {
        const parsed = parse(`
          var R = require("React");
          var Component = () => R.createElement('div', {});
          module.exports = Component;
        `);
        const actual = findComponents(parsed);

        expect(actual.length).toBe(1);
      });

      it('does not process X.createElement of other modules', () => {
        const parsed = parse(`
          var R = require("NoReact");
          var Component = () => R.createElement({});
          module.exports = Component;
        `);
        const actual = findComponents(parsed);

        expect(actual.length).toBe(0);
      });

      it('resolves an imported stateless component with JSX', () => {
        const parsed = parse(`
          import Component from 'statelessJsx';
          module.exports = Component;
        `);
        const actual = findComponents(parsed, mockImporter);

        expect(actual.length).toBe(1);
      });

      it('resolves an imported stateless component with React.createElement', () => {
        const parsed = parse(`
          import Component from 'statelessCreateElement';
          module.exports = Component;
        `);
        const actual = findComponents(parsed, mockImporter);

        expect(actual.length).toBe(1);
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

          module.exports = extendStyles(ColoredView);
        `;

        const parsed = parse(source);
        const actual = findComponents(parsed);

        expect(actual.length).toBe(1);
        expect(actual[0].value.type).toEqual('CallExpression');
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

          module.exports = ForwardedColoredView
        `;

        const parsed = parse(source);
        const actual = findComponents(parsed);

        expect(actual.length).toBe(1);
        expect(actual[0].value.type).toEqual('CallExpression');
      });

      it('resolves an imported forwardRef component', () => {
        const parsed = parse(`
          import Component from 'forwardRef';
          module.exports = Component;
        `);
        const actual = findComponents(parsed, mockImporter);

        expect(actual.length).toBe(1);
        expect(actual[0].value.type).toEqual('CallExpression');
      });
    });

    describe('module.exports = <C>; / exports.foo = <C>;', () => {
      describe('React.createClass', () => {
        it('finds assignments to exports', () => {
          const parsed = parse(`
            var R = require("React");
            var Component = R.createClass({});
            exports.foo = 42;
            exports.Component = Component;
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('finds multiple exported components', () => {
          const parsed = parse(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `);
          const actual = findComponents(parsed);
          const expectedA = parsed.get(
            'body',
            1,
            'declarations',
            0,
            'init',
            'arguments',
            0,
          );
          const expectedB = parsed.get(
            'body',
            2,
            'declarations',
            0,
            'init',
            'arguments',
            0,
          );

          expect(actual.length).toBe(2);
          expect(actual[0].node).toBe(expectedA.node);
          expect(actual[1].node).toBe(expectedB.node);
        });

        it('finds multiple exported components with hocs', () => {
          const parsed = parse(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentA = hoc(ComponentA);
            exports.ComponentB = hoc(ComponentB);
          `);
          const actual = findComponents(parsed);
          const expectedA = parsed.get(
            'body',
            1,
            'declarations',
            0,
            'init',
            'arguments',
            0,
          );
          const expectedB = parsed.get(
            'body',
            2,
            'declarations',
            0,
            'init',
            'arguments',
            0,
          );

          expect(actual.length).toBe(2);
          expect(actual[0].node).toBe(expectedA.node);
          expect(actual[1].node).toBe(expectedB.node);
        });

        it('finds only exported components', () => {
          let parsed = parse(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentB = ComponentB;
          `);
          let actual = findComponents(parsed);
          const expected = parsed.get(
            'body',
            2,
            'declarations',
            0,
            'init',
            'arguments',
            0,
          );

          expect(actual.length).toBe(1);
          expect(actual[0].node).toBe(expected.node);

          parsed = parse(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            module.exports = ComponentB;
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('finds exported components only once', () => {
          const parsed = parse(`
            var R = require("React");
            var ComponentA = R.createClass({});
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentA;
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'createClass';
            exports.ComponentA = Component;
            exports.ComponentB = Component;
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });

      describe('class definition', () => {
        it('finds assignments to exports', () => {
          const parsed = parse(`
            var R = require("React");
            class Component extends R.Component {}
            exports.foo = 42;
            exports.Component = Component;
          `);
          const actual = findComponents(parsed);
          const expected = parsed.get('body', 1);

          expect(actual.length).toBe(1);
          expect(actual[0].node).toBe(expected.node);
        });

        it('finds multiple exported components', () => {
          const parsed = parse(`
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `);
          const actual = findComponents(parsed);
          const expectedA = parsed.get('body', 1);
          const expectedB = parsed.get('body', 2);

          expect(actual.length).toBe(2);
          expect(actual[0].node).toBe(expectedA.node);
          expect(actual[1].node).toBe(expectedB.node);
        });

        it('finds only exported components', () => {
          let parsed = parse(`
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentB = ComponentB;
          `);
          let actual = findComponents(parsed);

          expect(actual.length).toBe(1);

          parsed = parse(`
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            module.exports = ComponentB;
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('finds exported components only once', () => {
          const parsed = parse(`
            var R = require("React");
            class ComponentA extends R.Component {}
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentA;
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'classDec';
            exports.ComponentA = Component;
            exports.ComponentB = Component;
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });
    });
  });

  describe('ES6 export declarations', () => {
    describe('export default <component>;', () => {
      describe('React.createClass', () => {
        it('finds default export', () => {
          let parsed = parse(`
            var React = require("React");
            var Component = React.createClass({});
            export default Component
          `);
          let actual = findComponents(parsed);
          const expected = parsed.get(
            'body',
            1,
            'declarations',
            0,
            'init',
            'arguments',
            0,
          );

          expect(actual.length).toBe(1);
          expect(actual[0].node).toBe(expected.node);

          parsed = parse(`
            var React = require("React");
            export default React.createClass({});
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('finds multiple exported components', () => {
          let parsed = parse(`
            import React, { createElement } from "React"
            export var Component = React.createClass({});
            export default React.createClass({});
          `);
          let actual = findComponents(parsed);
          const expectedA = parsed.get(
            'body',
            1,
            'declaration',
            'declarations',
            0,
            'init',
            'arguments',
            0,
          );
          const expectedB = parsed.get(
            'body',
            2,
            'declaration',
            'arguments',
            0,
          );

          expect(actual.length).toBe(2);
          expect(actual[0].node).toBe(expectedA.node);
          expect(actual[1].node).toBe(expectedB.node);

          parsed = parse(`
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export {Component};
            export default React.createClass({});
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export default React.createClass({});
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'createClass';
            export default Component;
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });

      describe('class definition', () => {
        it('finds default export', () => {
          let parsed = parse(`
            import React from 'React';
            class Component extends React.Component {}
            export default Component;
          `);
          let actual = findComponents(parsed);
          const expected = parsed.get('body', 1);

          expect(actual.length).toBe(1);
          expect(actual[0].node).toBe(expected.node);

          parsed = parse(`
            import React from 'React';
            export default class Component extends React.Component {};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('finds multiple exported components', () => {
          let parsed = parse(`
            import React from 'React';
            export var Component = class extends React.Component {};
            export default class ComponentB extends React.Component{};
          `);
          let actual = findComponents(parsed);
          const expectedA = parsed.get(
            'body',
            1,
            'declaration',
            'declarations',
            0,
            'init',
          );
          const expectedB = parsed.get('body', 2, 'declaration');

          expect(actual.length).toBe(2);
          expect(actual[0].node).toBe(expectedA.node);
          expect(actual[1].node).toBe(expectedB.node);

          parsed = parse(`
            import React from 'React';
            var Component = class extends React.Component {};
            export {Component};
            export default class ComponentB extends React.Component{};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            import React from 'React';
            var Component = class extends React.Component {};
            export default class ComponentB extends React.Component{};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'classDec';
            export default Component;
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
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

            export default extendStyles(ColoredView);
          `;

          const parsed = parse(source);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].value.type).toEqual('CallExpression');
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

            export default ForwardedColoredView
          `;

          const parsed = parse(source);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].value.type).toEqual('CallExpression');
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'forwardRef';
            export default Component;
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });
    });

    describe('export var foo = <C>, ...;', () => {
      describe('React.createClass', () => {
        it('finds named exports', () => {
          let parsed = parse(`
            var React = require("React");
            export var somethingElse = 42, Component = React.createClass({});
          `);
          let actual = findComponents(parsed);
          const expected = parsed.get(
            'body',
            1,
            'declaration',
            'declarations',
            1,
            'init',
            'arguments',
            0,
          );

          expect(actual.length).toBe(1);
          expect(actual[0].node).toBe(expected.node);

          parsed = parse(`
            var React = require("React");
            export let Component = React.createClass({}), somethingElse = 42;
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);

          parsed = parse(`
            var React = require("React");
            export const something = 21,
             Component = React.createClass({}),
             somethingElse = 42;
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);

          parsed = parse(`
            var React = require("React");
            export var somethingElse = function() {};
            export let Component = React.createClass({});
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('finds multiple components', () => {
          let parsed = parse(`
            var R = require("React");
            export var ComponentA = R.createClass({}),
              ComponentB = R.createClass({});
          `);
          let actual = findComponents(parsed);

          expect(actual.length).toBe(2);

          parsed = parse(`
            var R = require("React");
            export var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentB};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            var R = require("React");
            var ComponentA = R.createClass({});
            export let ComponentB = R.createClass({});
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'createClass';
            export let ComponentA = Component;
            export let ComponentB = Component;
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });

      describe('class definition', () => {
        it('finds named exports', () => {
          let parsed = parse(`
            import React from 'React';
            export var somethingElse = 42,
              Component = class extends React.Component {};
          `);
          let actual = findComponents(parsed);
          const expected = parsed.get(
            'body',
            1,
            'declaration',
            'declarations',
            1,
            'init',
          );

          expect(actual.length).toBe(1);
          expect(actual[0].node).toBe(expected.node);

          parsed = parse(`
            import React from 'React';
            export let Component = class extends React.Component {},
              somethingElse = 42;
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassExpression');

          parsed = parse(`
            import React from 'React';
            export const something = 21,
              Component = class extends React.Component {},
              somethingElse = 42;
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassExpression');

          parsed = parse(`
            import React from 'React';
            export var somethingElse = function() {};
            export let Component  = class extends React.Component {};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassExpression');
        });

        it('finds multiple components', () => {
          let parsed = parse(`
            import React from 'React';
            export var ComponentA  = class extends React.Component {};
            export var ComponentB  = class extends React.Component {};
          `);
          let actual = findComponents(parsed);

          expect(actual.length).toBe(2);

          parsed = parse(`
            import React from 'React';
            export var ComponentA = class extends React.Component {};
            var ComponentB  = class extends React.Component {};
            export {ComponentB};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = class extends React.Component {};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassExpression');
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'classDec';
            export let ComponentA = Component;
            export let ComponentB = Component;
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });

      describe('stateless components', () => {
        it('finds named exports', () => {
          let parsed = parse(`
            import React from 'React';
            export var somethingElse = 42,
              Component = () => <div />;
          `);
          let actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ArrowFunctionExpression');

          parsed = parse(`
            import React from 'React';
            export let Component = () => <div />,
              somethingElse = 42;
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ArrowFunctionExpression');

          parsed = parse(`
            import React from 'React';
            export const something = 21,
              Component = () => <div />,
              somethingElse = 42;
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ArrowFunctionExpression');

          parsed = parse(`
            import React from 'React';
            export var somethingElse = function() {};
            export let Component = () => <div />
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ArrowFunctionExpression');
        });

        it('finds multiple components', () => {
          let parsed = parse(`
            import React from 'React';
            export var ComponentA = () => <div />
            export var ComponentB = () => <div />
          `);
          let actual = findComponents(parsed);

          expect(actual.length).toBe(2);

          parsed = parse(`
            import React from 'React';
            export var ComponentA = () => <div />
            var ComponentB  = () => <div />
            export {ComponentB};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = function() { return <div />; };
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('FunctionExpression');
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component1 from 'statelessJsx';
            import Component2 from 'statelessCreateElement';
            export var ComponentA = Component1, ComponentB = Component2;
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(2);
        });
      });

      describe('forwardRef components', () => {
        it('finds forwardRef components', () => {
          const source = `
            import React from 'react';
            import PropTypes from 'prop-types';
            import extendStyles from 'enhancers/extendStyles';

            export const ColoredView = extendStyles(React.forwardRef((props, ref) => (
              <div ref={ref} style={{backgroundColor: props.color}} />
            )));
          `;

          const parsed = parse(source);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].value.type).toEqual('CallExpression');
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'forwardRef';
            export let ComponentA = Component;
            export let ComponentB = Component;
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });
    });

    describe('export {<C>};', () => {
      describe('React.createClass', () => {
        it('finds exported specifiers', () => {
          let parsed = parse(`
            var React = require("React");
            var foo = 42;
            var Component = React.createClass({});
            export {foo, Component}
          `);
          let actual = findComponents(parsed);
          const expected = parsed.get(
            'body',
            2,
            'declarations',
            0,
            'init',
            'arguments',
            0,
          );

          expect(actual.length).toBe(1);
          expect(actual[0].node).toBe(expected.node);

          parsed = parse(`
            import React from "React"
            var foo = 42;
            var Component = React.createClass({});
            export {Component, foo}
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);

          parsed = parse(`
            import React, { createElement } from "React"
            var foo = 42;
            var baz = 21;
            var Component = React.createClass({});
            export {foo, Component as bar, baz}
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('finds multiple components', () => {
          const parsed = parse(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA as foo, ComponentB};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds multiple components with hocs', () => {
          const parsed = parse(`
            var R = require("React");
            var ComponentA = hoc(R.createClass({}));
            var ComponentB = hoc(R.createClass({}));
            export {ComponentA as foo, ComponentB};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA}
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('finds exported components only once', () => {
          const parsed = parse(`
            var R = require("React");
            var ComponentA = R.createClass({});
            export {ComponentA as foo, ComponentA as bar};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'createClass';
            export { Component, Component as ComponentB };
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });

      describe('class definition', () => {
        it('finds exported specifiers', () => {
          let parsed = parse(`
            import React from 'React';
            var foo = 42;
            var Component = class extends React.Component {};
            export {foo, Component};
          `);
          let actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassExpression');

          parsed = parse(`
            import React from 'React';
            var foo = 42;
            var Component = class extends React.Component {};
            export {Component, foo};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassExpression');

          parsed = parse(`
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = class extends React.Component {};
            export {foo, Component as bar, baz};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassExpression');
        });

        it('finds multiple components', () => {
          const parsed = parse(`
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA as foo, ComponentB};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds multiple components with hocs', () => {
          const parsed = parse(`
            import React from 'React';
            class ComponentA extends React.Component {};
            class ComponentB extends React.Component {};
            var WrappedA = hoc(ComponentA);
            var WrappedB = hoc(ComponentB);
            export {WrappedA, WrappedB};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassExpression');
        });

        it('finds exported components only once', () => {
          const parsed = parse(`
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA as foo, ComponentA as bar};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassExpression');
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'classDec';
            export { Component, Component as ComponentB };
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });

      describe('stateless components', () => {
        it('finds exported specifiers', () => {
          let parsed = parse(`
            import React from 'React';
            var foo = 42;
            function Component() { return <div />; }
            export {foo, Component};
          `);
          let actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('FunctionDeclaration');

          parsed = parse(`
            import React from 'React';
            var foo = 42;
            var Component = () => <div />;
            export {Component, foo};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ArrowFunctionExpression');

          parsed = parse(`
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = function () { return <div />; }
            export {foo, Component as bar, baz};
          `);
          actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('FunctionExpression');
        });

        it('finds multiple components', () => {
          const parsed = parse(`
            import React from 'React';
            var ComponentA = () => <div />;
            function ComponentB() { return <div />; }
            export {ComponentA as foo, ComponentB};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            import React from 'React';
            var ComponentA = () => <div />;
            var ComponentB = () => <div />;
            export {ComponentA};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ArrowFunctionExpression');
        });

        it('finds exported components only once', () => {
          const parsed = parse(`
            import React from 'React';
            var ComponentA = () => <div />;
            var ComponentB = () => <div />;
            export {ComponentA as foo, ComponentA as bar};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ArrowFunctionExpression');
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import ComponentA from 'statelessJsx';
            import ComponentB from 'statelessCreateElement';
            export { ComponentA, ComponentB };
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(2);
        });
      });

      describe('forwardRef components', () => {
        it('finds forwardRef components', () => {
          const source = `
            import React from 'react';
            import PropTypes from 'prop-types';
            import extendStyles from 'enhancers/extendStyles';

            const ColoredView = extendStyles(React.forwardRef((props, ref) => (
              <div ref={ref} style={{backgroundColor: props.color}} />
            )));

            export { ColoredView }
          `;

          const parsed = parse(source);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].value.type).toEqual('CallExpression');
        });

        it('supports imported components', () => {
          const parsed = parse(`
            import Component from 'forwardRef';
            export { Component, Component as ComponentB };
          `);
          const actual = findComponents(parsed, mockImporter);

          expect(actual.length).toBe(1);
        });
      });
    });

    describe('export <C>;', () => {
      describe('class definition', () => {
        it('finds named exports', () => {
          const parsed = parse(`
            import React from 'React';
            export var foo = 42;
            export class Component extends React.Component {};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassDeclaration');
        });

        it('finds multiple components', () => {
          const parsed = parse(`
            import React from 'React';
            export class ComponentA extends React.Component {};
            export class ComponentB extends React.Component {};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            import React from 'React';
            class ComponentA extends React.Component {};
            export class ComponentB extends React.Component {};
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('ClassDeclaration');
        });
      });

      describe('function declaration', () => {
        it('finds named exports', () => {
          const parsed = parse(`
            import React from 'React';
            export var foo = 42;
            export function Component() { return <div />; };
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('FunctionDeclaration');
        });

        it('finds multiple components', () => {
          const parsed = parse(`
            import React from 'React';
            export function ComponentA() { return <div />; };
            export function ComponentB() { return <div />; };
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(2);
        });

        it('finds only exported components', () => {
          const parsed = parse(`
            import React from 'React';
            function ComponentA() { return <div />; }
            export function ComponentB() { return <div />; };
          `);
          const actual = findComponents(parsed);

          expect(actual.length).toBe(1);
          expect(actual[0].node.type).toBe('FunctionDeclaration');
        });
      });
    });
  });
});
