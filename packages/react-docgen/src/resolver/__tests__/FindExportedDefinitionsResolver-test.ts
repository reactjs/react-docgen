import type { NodePath } from '@babel/traverse';
import { parse, noopImporter, makeMockImporter } from '../../../tests/utils';
import FindExportedDefinitionsResolver from '../FindExportedDefinitionsResolver.js';
import { describe, expect, test } from 'vitest';

describe('FindExportedDefinitionsResolver', () => {
  describe('no limit', () => {
    const resolver = new FindExportedDefinitionsResolver();

    function findComponentsInSource(
      source: string,
      importer = noopImporter,
    ): NodePath[] {
      return resolver.resolve(parse(source, {}, importer, true));
    }

    const mockImporter = makeMockImporter({
      createClass: stmtLast =>
        stmtLast(`
      import React from 'react'
      export default React.createClass({})
    `).get('declaration'),

      classDec: stmtLast =>
        stmtLast(`
      import React from 'react'
      export default class Component extends React.Component {}
    `).get('declaration'),

      classExpr: stmtLast =>
        stmtLast(`
      import React from 'react'
      var Component = class extends React.Component {}
      export default Component
    `).get('declaration'),

      statelessJsx: stmtLast =>
        stmtLast(`
      export default () => <div />
    `).get('declaration'),

      statelessCreateElement: stmtLast =>
        stmtLast(`
      import React from 'react'
      export default () => React.createElement('div', {})
    `).get('declaration'),

      forwardRef: stmtLast =>
        stmtLast(`
      import React from 'react'
      export default React.forwardRef((props, ref) => (
        <div ref={ref} style={{backgroundColor: props.color}} />
      ))
    `).get('declaration'),
    });

    describe('CommonJS module exports', () => {
      describe('React.createClass', () => {
        test('finds React.createClass', () => {
          const result = findComponentsInSource(`
          var React = require("React");
          var Component = React.createClass({});
          module.exports = Component;
        `);

          expect(result).toMatchSnapshot();
        });

        test('finds React.createClass, independent of the var name', () => {
          const result = findComponentsInSource(`
          var R = require("React");
          var Component = R.createClass({});
          module.exports = Component;
        `);

          expect(result).toMatchSnapshot();
        });

        test('does not process X.createClass of other modules', () => {
          const result = findComponentsInSource(`
          var R = require("NoReact");
          var Component = R.createClass({});
          module.exports = Component;
        `);

          expect(result).toMatchSnapshot();
        });

        test('resolves an imported variable to React.createClass', () => {
          const result = findComponentsInSource(
            `
          import Component from 'createClass';
          module.exports = Component;
        `,
            mockImporter,
          );

          expect(result).toMatchSnapshot();
        });
      });

      describe('class definitions', () => {
        test('finds class declarations', () => {
          const result = findComponentsInSource(`
          var React = require("React");
          class Component extends React.Component {}
          module.exports = Component;
        `);

          expect(result).toMatchSnapshot();
        });

        test('finds class expression', () => {
          const result = findComponentsInSource(`
          var React = require("React");
          var Component = class extends React.Component {}
          module.exports = Component;
        `);

          expect(result).toMatchSnapshot();
        });

        test('finds class definition, independent of the var name', () => {
          const result = findComponentsInSource(`
          var R = require("React");
          class Component extends R.Component {}
          module.exports = Component;
        `);

          expect(result).toMatchSnapshot();
        });

        test('resolves an imported variable to class declaration', () => {
          const result = findComponentsInSource(
            `
          import Component from 'classDec';
          module.exports = Component;
        `,
            mockImporter,
          );

          expect(result).toMatchSnapshot();
        });

        test('resolves an imported variable to class expression', () => {
          const result = findComponentsInSource(
            `
          import Component from 'classExpr';
          module.exports = Component;
        `,
            mockImporter,
          );

          expect(result).toMatchSnapshot();
        });
      });

      describe('stateless components', () => {
        test('finds stateless component with JSX', () => {
          const result = findComponentsInSource(`
          var React = require("React");
          var Component = () => <div />;
          module.exports = Component;
        `);

          expect(result).toMatchSnapshot();
        });

        test('finds stateless components with React.createElement, independent of the var name', () => {
          const result = findComponentsInSource(`
          var R = require("React");
          var Component = () => R.createElement('div', {});
          module.exports = Component;
        `);

          expect(result).toMatchSnapshot();
        });

        test('does not process X.createElement of other modules', () => {
          const result = findComponentsInSource(`
          var R = require("NoReact");
          var Component = () => R.createElement({});
          module.exports = Component;
        `);

          expect(result).toMatchSnapshot();
        });

        test('resolves an imported stateless component with JSX', () => {
          const result = findComponentsInSource(
            `
          import Component from 'statelessJsx';
          module.exports = Component;
        `,
            mockImporter,
          );

          expect(result).toMatchSnapshot();
        });

        test('resolves an imported stateless component with React.createElement', () => {
          const result = findComponentsInSource(
            `
          import Component from 'statelessCreateElement';
          module.exports = Component;
        `,
            mockImporter,
          );

          expect(result).toMatchSnapshot();
        });
      });

      describe('forwardRef components', () => {
        test('finds forwardRef components', () => {
          const result = findComponentsInSource(`
          import React from 'react';
          import PropTypes from 'prop-types';
          import extendStyles from 'enhancers/extendStyles';

          const ColoredView = React.forwardRef((props, ref) => (
            <div ref={ref} style={{backgroundColor: props.color}} />
          ));

          module.exports = extendStyles(ColoredView);
        `);

          expect(result).toMatchSnapshot();
        });

        test('finds none inline forwardRef components', () => {
          const result = findComponentsInSource(`
          import React from 'react';
          import PropTypes from 'prop-types';
          import extendStyles from 'enhancers/extendStyles';

          function ColoredView(props, ref) {
            return <div ref={ref} style={{backgroundColor: props.color}} />
          }

          const ForwardedColoredView = React.forwardRef(ColoredView);

          module.exports = ForwardedColoredView
        `);

          expect(result).toMatchSnapshot();
        });

        test('resolves an imported forwardRef component', () => {
          const result = findComponentsInSource(
            `
          import Component from 'forwardRef';
          module.exports = Component;
        `,
            mockImporter,
          );

          expect(result).toMatchSnapshot();
        });
      });

      describe('module.exports = <C>; / exports.foo = <C>;', () => {
        describe('React.createClass', () => {
          test('finds assignments to exports', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var Component = R.createClass({});
            exports.foo = 42;
            exports.Component = Component;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple exported components', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple exported components with hocs', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentA = hoc(ComponentA);
            exports.ComponentB = hoc(ComponentB);
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components on export', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentB = ComponentB;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            module.exports = ComponentB;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported components only once', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentA;
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `
            import Component from 'createClass';
            exports.ComponentA = Component;
            exports.ComponentB = Component;
          `,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });

        describe('class definition', () => {
          test('finds assignments to exports', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            class Component extends R.Component {}
            exports.foo = 42;
            exports.Component = Component;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple exported components', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components on export', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentB = ComponentB;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            module.exports = ComponentB;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported components only once', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            class ComponentA extends R.Component {}
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentA;
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `
            import Component from 'classDec';
            exports.ComponentA = Component;
            exports.ComponentB = Component;
          `,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });
      });
    });

    describe('ES6 export declarations', () => {
      describe('export default <component>;', () => {
        describe('React.createClass', () => {
          test('finds reassigned default export', () => {
            const result = findComponentsInSource(`
            var React = require("React");
            var Component = React.createClass({});
            export default Component
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds default export', () => {
            const result = findComponentsInSource(`
            var React = require("React");
            export default React.createClass({});
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple exported components with export var', () => {
            const result = findComponentsInSource(`
            import React, { createElement } from "React"
            export var Component = React.createClass({});
            export default React.createClass({});
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple exported components with named export', () => {
            const result = findComponentsInSource(`
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export {Component};
            export default React.createClass({});
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export default React.createClass({});
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `import Component from 'createClass';
             export default Component;`,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });

        describe('class definition', () => {
          test('finds default export', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            class Component extends React.Component {}
            export default Component;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds default export inline', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export default class Component extends React.Component {};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple exported components with export var', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var Component = class extends React.Component {};
            export default class ComponentB extends React.Component{};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple exported components with named export', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var Component = class extends React.Component {};
            export {Component};
            export default class ComponentB extends React.Component{};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var Component = class extends React.Component {};
            export default class ComponentB extends React.Component{};
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `import Component from 'classDec';
             export default Component;`,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });

        describe('forwardRef components', () => {
          test('finds forwardRef components', () => {
            const result = findComponentsInSource(`
            import React from 'react';
            import PropTypes from 'prop-types';
            import extendStyles from 'enhancers/extendStyles';

            const ColoredView = React.forwardRef((props, ref) => (
              <div ref={ref} style={{backgroundColor: props.color}} />
            ));

            export default extendStyles(ColoredView);
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds none inline forwardRef components', () => {
            const result = findComponentsInSource(`
            import React from 'react';
            import PropTypes from 'prop-types';
            import extendStyles from 'enhancers/extendStyles';

            function ColoredView(props, ref) {
              return <div ref={ref} style={{backgroundColor: props.color}} />
            }

            const ForwardedColoredView = React.forwardRef(ColoredView);

            export default ForwardedColoredView
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `import Component from 'forwardRef';
             export default Component;`,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });
      });

      describe('export var foo = <C>, ...;', () => {
        describe('React.createClass', () => {
          test('finds named exports 1', () => {
            const result = findComponentsInSource(`
            var React = require("React");
            export var somethingElse = 42, Component = React.createClass({});
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds named exports 2', () => {
            const result = findComponentsInSource(`
            var React = require("React");
            export let Component = React.createClass({}), somethingElse = 42;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds named exports 3', () => {
            const result = findComponentsInSource(`
            var React = require("React");
            export const something = 21,
             Component = React.createClass({}),
             somethingElse = 42;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds named exports 4', () => {
            const result = findComponentsInSource(`
            var React = require("React");
            export var somethingElse = function() {};
            export let Component = React.createClass({});
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            export var ComponentA = R.createClass({}),
              ComponentB = R.createClass({});
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components with separate export statements', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            export var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentB};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            export let ComponentB = R.createClass({});
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `import Component from 'createClass';
             export let ComponentA = Component;
             export let ComponentB = Component;`,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });

        describe('class definition', () => {
          test('finds named exports 1', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var somethingElse = 42,
              Component = class extends React.Component {};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds named exports 2', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export let Component = class extends React.Component {},
              somethingElse = 42;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds named exports 3', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export const something = 21,
              Component = class extends React.Component {},
              somethingElse = 42;
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds named exports 4', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var somethingElse = function() {};
            export let Component  = class extends React.Component {};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var ComponentA  = class extends React.Component {};
            export var ComponentB  = class extends React.Component {};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components with assigned component', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var ComponentA = class extends React.Component {};
            var ComponentB  = class extends React.Component {};
            export {ComponentB};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = class extends React.Component {};
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `
            import Component from 'classDec';
            export let ComponentA = Component;
            export let ComponentB = Component;
          `,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });

        describe('stateless components', () => {
          test('finds named exports 1', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var somethingElse = 42,
              Component = () => <div />;
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components 2', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export let Component = () => <div />,
              somethingElse = 42;
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components 3', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export const something = 21,
              Component = () => <div />,
              somethingElse = 42;
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components 4', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var somethingElse = function() {};
            export let Component = () => <div />
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var ComponentA = () => <div />
            export var ComponentB = () => <div />
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components with named export', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var ComponentA = () => <div />
            var ComponentB  = () => <div />
            export {ComponentB};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = function() { return <div />; };
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `import Component1 from 'statelessJsx';
             import Component2 from 'statelessCreateElement';
             export var ComponentA = Component1, ComponentB = Component2;`,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });

        describe('forwardRef components', () => {
          test('finds forwardRef components', () => {
            const result = findComponentsInSource(`
            import React from 'react';
            import PropTypes from 'prop-types';
            import extendStyles from 'enhancers/extendStyles';

            export const ColoredView = extendStyles(React.forwardRef((props, ref) => (
              <div ref={ref} style={{backgroundColor: props.color}} />
            )));
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `
            import Component from 'forwardRef';
            export let ComponentA = Component;
            export let ComponentB = Component;
          `,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });
      });

      describe('export {<C>};', () => {
        describe('React.createClass', () => {
          test('finds exported specifiers', () => {
            const result = findComponentsInSource(`
            var React = require("React");
            var foo = 42;
            var Component = React.createClass({});
            export {foo, Component}
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported specifiers 2', () => {
            const result = findComponentsInSource(`
            import React from "React"
            var foo = 42;
            var Component = React.createClass({});
            export {Component, foo}
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported specifiers 3', () => {
            const result = findComponentsInSource(`
            import React, { createElement } from "React"
            var foo = 42;
            var baz = 21;
            var Component = React.createClass({});
            export {foo, Component as bar, baz}
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA as foo, ComponentB};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components with hocs', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = hoc(R.createClass({}));
            var ComponentB = hoc(R.createClass({}));
            export {ComponentA as foo, ComponentB};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA}
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported components only once', () => {
            const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            export {ComponentA as foo, ComponentA as bar};
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `import Component from 'createClass';
             export { Component, Component as ComponentB };`,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });

        describe('class definition', () => {
          test('finds exported specifiers 1', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var Component = class extends React.Component {};
            export {foo, Component};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported specifiers 2', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var Component = class extends React.Component {};
            export {Component, foo};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported specifiers 3', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = class extends React.Component {};
            export {foo, Component as bar, baz};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA as foo, ComponentB};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components with hocs', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            class ComponentA extends React.Component {};
            class ComponentB extends React.Component {};
            var WrappedA = hoc(ComponentA);
            var WrappedB = hoc(ComponentB);
            export {WrappedA, WrappedB};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported components only once', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA as foo, ComponentA as bar};
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `
            import Component from 'classDec';
            export { Component, Component as ComponentB };
          `,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });

        describe('stateless components', () => {
          test('finds exported specifiers 1', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            function Component() { return <div />; }
            export {foo, Component};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported specifiers 2', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var Component = () => <div />;
            export {Component, foo};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported specifiers 3', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = function () { return <div />; }
            export {foo, Component as bar, baz};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = () => <div />;
            function ComponentB() { return <div />; }
            export {ComponentA as foo, ComponentB};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = () => <div />;
            var ComponentB = () => <div />;
            export {ComponentA};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds exported components only once', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = () => <div />;
            var ComponentB = () => <div />;
            export {ComponentA as foo, ComponentA as bar};
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `
            import ComponentA from 'statelessJsx';
            import ComponentB from 'statelessCreateElement';
            export { ComponentA, ComponentB };
          `,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });

        describe('forwardRef components', () => {
          test('finds forwardRef components', () => {
            const result = findComponentsInSource(`
            import React from 'react';
            import PropTypes from 'prop-types';
            import extendStyles from 'enhancers/extendStyles';

            const ColoredView = extendStyles(React.forwardRef((props, ref) => (
              <div ref={ref} style={{backgroundColor: props.color}} />
            )));

            export { ColoredView }
          `);

            expect(result).toMatchSnapshot();
          });

          test('supports imported components', () => {
            const result = findComponentsInSource(
              `
            import Component from 'forwardRef';
            export { Component, Component as ComponentB };
          `,
              mockImporter,
            );

            expect(result).toMatchSnapshot();
          });
        });
      });

      describe('export <C>;', () => {
        describe('class definition', () => {
          test('finds named exports', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var foo = 42;
            export class Component extends React.Component {};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export class ComponentA extends React.Component {};
            export class ComponentB extends React.Component {};
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            class ComponentA extends React.Component {};
            export class ComponentB extends React.Component {};
          `);

            expect(result).toMatchSnapshot();
          });
        });

        describe('function declaration', () => {
          test('finds named exports', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export var foo = 42;
            export function Component() { return <div />; };
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds multiple components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            export function ComponentA() { return <div />; };
            export function ComponentB() { return <div />; };
          `);

            expect(result).toMatchSnapshot();
          });

          test('finds only exported components', () => {
            const result = findComponentsInSource(`
            import React from 'React';
            function ComponentA() { return <div />; }
            export function ComponentB() { return <div />; };
          `);

            expect(result).toMatchSnapshot();
          });
        });
      });
    });
  });

  describe('limit 1', () => {
    const resolver = new FindExportedDefinitionsResolver({ limit: 1 });

    function findComponentsInSource(
      source: string,
      importer = noopImporter,
    ): NodePath[] {
      return resolver.resolve(parse(source, {}, importer, true));
    }
    const mockImporter = makeMockImporter({
      createClass: stmtLast =>
        stmtLast(`
      import React from 'react'
      export default React.createClass({})
    `).get('declaration'),

      classDec: stmtLast =>
        stmtLast(`
      import React from 'react'
      export default class Component extends React.Component {}
    `).get('declaration'),

      classExpr: stmtLast =>
        stmtLast(`
      import React from 'react'
      var Component = class extends React.Component {}
      export default Component
    `).get('declaration'),

      statelessJsx: stmtLast =>
        stmtLast(`export default () => <div />`).get('declaration'),

      statelessCreateElement: stmtLast =>
        stmtLast(`
      import React from 'react'
      export default () => React.createElement('div', {})
    `).get('declaration'),

      forwardRef: stmtLast =>
        stmtLast(`
      import React from 'react'
      export default React.forwardRef((props, ref) => (
        <div ref={ref} style={{backgroundColor: props.color}} />
      ))
    `).get('declaration'),
    });

    describe('CommonJS module exports', () => {
      describe('React.createClass', () => {
        test('finds React.createClass', () => {
          const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });

        test('finds React.createClass with hoc', () => {
          const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = hoc(Component);
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });

        test('finds React.createClass with hoc and args', () => {
          const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = hoc(arg1, arg2)(Component);
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });

        test('finds React.createClass with two hocs', () => {
          const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = hoc2(arg2b, arg2b)(
            hoc1(arg1a, arg2a)(Component)
          );
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });

        test('finds React.createClass with three hocs', () => {
          const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = hoc3(arg3a, arg3b)(
            hoc2(arg2b, arg2b)(
              hoc1(arg1a, arg2a)(Component)
            )
          );
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });

        test('finds React.createClass, independent of the var name', () => {
          const source = `
          var R = require("React");
          var Component = R.createClass({});
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });

        test('does not process X.createClass of other modules', () => {
          const source = `
          var R = require("NoReact");
          var Component = R.createClass({});
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(0);
        });

        test('resolves an imported variable to React.createClass', () => {
          const source = `
          import Component from 'createClass';
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(0);
        });
      });

      describe('class definitions', () => {
        test('finds class declarations', () => {
          const source = `
          var React = require("React");
          class Component extends React.Component {}
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
          expect(result[0].node.type).toBe('ClassDeclaration');
        });

        test('finds class expression', () => {
          const source = `
          var React = require("React");
          var Component = class extends React.Component {}
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
          expect(result[0].node.type).toBe('ClassExpression');
        });

        test('finds class definition, independent of the var name', () => {
          const source = `
          var R = require("React");
          class Component extends R.Component {}
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
          expect(result[0].node.type).toBe('ClassDeclaration');
        });

        test('resolves an imported variable to class declaration', () => {
          const source = `
          import Component from 'classDec';
          module.exports = Component;
        `;

          const result = findComponentsInSource(source, mockImporter);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
          expect(result[0].node.type).toBe('ClassDeclaration');
        });

        test('resolves an imported variable to class expression', () => {
          const source = `
          import Component from 'classExpr';
          module.exports = Component;
        `;

          const result = findComponentsInSource(source, mockImporter);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
          expect(result[0].node.type).toBe('ClassExpression');
        });
      });

      describe('stateless components', () => {
        test('finds stateless component with JSX', () => {
          const source = `
          var React = require("React");
          var Component = () => <div />;
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });

        test('finds stateless components with React.createElement, independent of the var name', () => {
          const source = `
          var R = require("React");
          var Component = () => R.createElement('div', {});
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });

        test('does not process X.createElement of other modules', () => {
          const source = `
          var R = require("NoReact");
          var Component = () => R.createElement({});
          module.exports = Component;
        `;

          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(0);
        });

        test('resolves an imported stateless component with JSX', () => {
          const source = `
          import Component from 'statelessJsx';
          module.exports = Component;
        `;

          const result = findComponentsInSource(source, mockImporter);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });

        test('resolves an imported stateless component with React.createElement', () => {
          const source = `
          import Component from 'statelessCreateElement';
          module.exports = Component;
        `;

          const result = findComponentsInSource(source, mockImporter);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
        });
      });

      describe('module.exports = <C>; / exports.foo = <C>;', () => {
        describe('React.createClass', () => {
          test('finds assignments to exports', () => {
            const source = `
            var R = require("React");
            var Component = R.createClass({});
            exports.foo = 42;
            exports.Component = Component;
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('errors if multiple components are exported', () => {
            const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `;

            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported on exports', () => {
            const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentB = ComponentB;
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('accepts multiple definitions if only one is exported', () => {
            const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            module.exports = ComponentB;
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('supports imported components', () => {
            const source = `
            import Component from 'createClass';
            exports.ComponentB = Component;
          `;

            const result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });
        });

        describe('class definition', () => {
          test('finds assignments to exports', () => {
            const source = `
            var R = require("React");
            class Component extends R.Component {}
            exports.foo = 42;
            exports.Component = Component;
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });

          test('errors if multiple components are exported', () => {
            const source = `
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `;

            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported', () => {
            let source = `
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentB = ComponentB;
          `;

            let result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');

            source = `
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            module.exports = ComponentB;
          `;

            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });

          test('supports imported components', () => {
            const source = `
            import Component from 'classDec';
            exports.ComponentB = Component;
          `;

            const result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });
        });
      });
    });

    describe('ES6 export declarations', () => {
      describe('export default <component>;', () => {
        describe('React.createClass', () => {
          test('finds default export', () => {
            const source = `
            var React = require("React");
            var Component = React.createClass({});
            export default Component
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('finds default export inline', () => {
            const source = `
            var React = require("React");
            export default React.createClass({});
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('errors if multiple components are exported', () => {
            const source = `
            import React, { createElement } from "React"
            export var Component = React.createClass({})
            export default React.createClass({});
          `;

            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('errors if multiple components are exported with named export', () => {
            const source = `
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export {Component};
            export default React.createClass({});
          `;

            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported', () => {
            const source = `
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export default React.createClass({});
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('supports imported components', () => {
            const source = `
            import Component from 'createClass';
            export default Component;
          `;

            const result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });
        });

        describe('class definition', () => {
          test('finds default export', () => {
            let source = `
            import React from 'React';
            class Component extends React.Component {}
            export default Component;
          `;

            let result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');

            source = `
            import React from 'React';
            export default class Component extends React.Component {};
          `;

            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });

          test('finds default export with hoc', () => {
            const source = `
            import React from 'React';
            class Component extends React.Component {}
            export default hoc(Component);
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });

          test('finds default export with hoc and args', () => {
            const source = `
            import React from 'React';
            class Component extends React.Component {}
            export default hoc(arg1, arg2)(Component);
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });

          test('finds default export with two hocs', () => {
            const source = `
            import React from 'React';
            class Component extends React.Component {}
            export default hoc2(arg2b, arg2b)(
              hoc1(arg1a, arg2a)(Component)
            );
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });

          test('errors if multiple components are exported', () => {
            let source = `
            import React from 'React';
            export var Component = class extends React.Component {};
            export default class ComponentB extends React.Component{};
          `;

            expect(() => findComponentsInSource(source)).toThrow();

            source = `
            import React from 'React';
            var Component = class extends React.Component {};
            export {Component};
            export default class ComponentB extends React.Component{};
          `;
            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported', () => {
            const source = `
            import React from 'React';
            var Component = class extends React.Component {};
            export default class ComponentB extends React.Component{};
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });

          test('supports imported components', () => {
            const source = `
            import Component from 'classDec';
            export default Component;
          `;

            const result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });
        });
      });

      describe('export var foo = <C>, ...;', () => {
        describe('React.createClass', () => {
          test('finds named exports with export var', () => {
            const source = `
            var React = require("React");
            export var somethingElse = 42, Component = React.createClass({});
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('finds named exports with export let', () => {
            const source = `
            var React = require("React");
            export let Component = React.createClass({}), somethingElse = 42;
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('finds named exports with export const', () => {
            const source = `
            var React = require("React");
            export const something = 21,
             Component = React.createClass({}),
             somethingElse = 42;
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('finds named exports with export let and additional export', () => {
            const source = `
            var React = require("React");
            export var somethingElse = function() {};
            export let Component = React.createClass({});
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('errors if multiple components are exported', () => {
            let source = `
            var R = require("React");
            export var ComponentA = R.createClass({}),
              ComponentB = R.createClass({});
          `;

            expect(() => findComponentsInSource(source)).toThrow();

            source = `
            var R = require("React");
            export var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentB};
          `;

            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported', () => {
            const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            export let ComponentB = R.createClass({});
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('supports imported components', () => {
            const source = `
            import Component from 'createClass';
            export let ComponentB = Component;
          `;

            const result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });
        });

        describe('class definition', () => {
          test('finds named exports', () => {
            let source = `
            import React from 'React';
            export var somethingElse = 42,
              Component = class extends React.Component {};
          `;
            let result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassExpression');

            source = `
            import React from 'React';
            export let Component = class extends React.Component {},
              somethingElse = 42;
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassExpression');

            source = `
            import React from 'React';
            export const something = 21,
              Component = class extends React.Component {},
              somethingElse = 42;
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassExpression');

            source = `
            import React from 'React';
            export var somethingElse = function() {};
            export let Component  = class extends React.Component {};
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassExpression');
          });

          test('errors if multiple components are exported', () => {
            let source = `
            import React from 'React';
            export var ComponentA  = class extends React.Component {};
            export var ComponentB  = class extends React.Component {};
          `;

            expect(() => findComponentsInSource(source)).toThrow();

            source = `
            import React from 'React';
            export var ComponentA = class extends React.Component {};
            var ComponentB  = class extends React.Component {};
            export {ComponentB};
          `;
            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported', () => {
            const source = `
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = class extends React.Component {};
          `;
            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassExpression');
          });

          test('supports imported components', () => {
            const source = `
            import Component from 'classDec';
            export let ComponentB = Component;
          `;

            const result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });
        });

        describe('stateless components', () => {
          test('finds named exports', () => {
            let source = `
            import React from 'React';
            export var somethingElse = 42,
              Component = () => <div />;
          `;
            let result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');

            source = `
            import React from 'React';
            export let Component = () => <div />,
              somethingElse = 42;
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');

            source = `
            import React from 'React';
            export const something = 21,
              Component = () => <div />,
              somethingElse = 42;
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');

            source = `
            import React from 'React';
            export var somethingElse = function() {};
            export let Component = () => <div />
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');
          });

          test('errors if multiple components are exported', () => {
            let source = `
            import React from 'React';
            export var ComponentA = () => <div />
            export var ComponentB = () => <div />
          `;

            expect(() => findComponentsInSource(source)).toThrow();

            source = `
            import React from 'React';
            export var ComponentA = () => <div />
            var ComponentB  = () => <div />
            export {ComponentB};
          `;
            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported', () => {
            const source = `
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = function() { return <div />; };
          `;
            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('FunctionExpression');
          });

          test('supports imported components', () => {
            let source = `
            import Component from 'statelessJsx';
            export var ComponentA = Component;
          `;

            let result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');

            source = `
            import Component from 'statelessCreateElement';
            export var ComponentB = Component;
          `;

            result = findComponentsInSource(source, mockImporter);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');
          });
        });
      });

      describe('export {<C>};', () => {
        describe('React.createClass', () => {
          test('finds exported specifiers 1', () => {
            const source = `
            var React = require("React");
            var foo = 42;
            var Component = React.createClass({});
            export {foo, Component}
          `;
            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('finds exported specifiers 2', () => {
            const source = `
            import React from "React"
            var foo = 42;
            var Component = React.createClass({});
            export {Component, foo}
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('finds exported specifiers 3', () => {
            const source = `
            import React, { createElement } from "React"
            var foo = 42;
            var baz = 21;
            var Component = React.createClass({});
            export {foo, Component as bar, baz}
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('errors if multiple components are exported', () => {
            const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA as foo, ComponentB};
          `;

            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported', () => {
            const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA}
          `;

            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });

          test('supports imported components', () => {
            const source = `
            import Component from 'createClass';
            export { Component };
          `;

            const result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
          });
        });

        describe('class definition', () => {
          test('finds exported specifiers', () => {
            let source = `
            import React from 'React';
            var foo = 42;
            var Component = class extends React.Component {};
            export {foo, Component};
          `;
            let result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassExpression');

            source = `
            import React from 'React';
            var foo = 42;
            var Component = class extends React.Component {};
            export {Component, foo};
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassExpression');

            source = `
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = class extends React.Component {};
            export {foo, Component as bar, baz};
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassExpression');
          });

          test('errors if multiple components are exported', () => {
            const source = `
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA as foo, ComponentB};
          `;

            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported', () => {
            const source = `
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA};
          `;
            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassExpression');
          });

          test('supports imported components', () => {
            const source = `
            import Component from 'classDec';
            export { Component };
          `;

            const result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ClassDeclaration');
          });
        });

        describe('stateless components', () => {
          test('finds exported specifiers', () => {
            let source = `
            import React from 'React';
            var foo = 42;
            function Component() { return <div />; }
            export {foo, Component};
          `;
            let result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('FunctionDeclaration');

            source = `
            import React from 'React';
            var foo = 42;
            var Component = () => <div />;
            export {Component, foo};
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');

            source = `
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = function () { return <div />; }
            export {foo, Component as bar, baz};
          `;
            result = findComponentsInSource(source);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('FunctionExpression');
          });

          test('errors if multiple components are exported', () => {
            const source = `
            import React from 'React';
            var ComponentA = () => <div />;
            function ComponentB() { return <div />; }
            export {ComponentA as foo, ComponentB};
          `;

            expect(() => findComponentsInSource(source)).toThrow();
          });

          test('accepts multiple definitions if only one is exported', () => {
            const source = `
            import React from 'React';
            var ComponentA = () => <div />;
            var ComponentB = () => <div />;
            export {ComponentA};
          `;
            const result = findComponentsInSource(source);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');
          });

          test('supports imported components', () => {
            let source = `
            import Component from 'statelessJsx';
            export { Component as ComponentA };
          `;

            let result = findComponentsInSource(source, mockImporter);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');

            source = `
            import Component from 'statelessCreateElement';
            export { Component as ComponentB };
          `;

            result = findComponentsInSource(source, mockImporter);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].node.type).toBe('ArrowFunctionExpression');
          });
        });
      });

      // Only applies to classes
      describe('export <C>;', () => {
        test('finds named exports', () => {
          const source = `
          import React from 'React';
          export var foo = 42;
          export class Component extends React.Component {};
        `;
          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
          expect(result[0].node.type).toBe('ClassDeclaration');
        });

        test('errors if multiple components are exported', () => {
          const source = `
          import React from 'React';
          export class ComponentA extends React.Component {};
          export class ComponentB extends React.Component {};
        `;

          expect(() => findComponentsInSource(source)).toThrow();
        });

        test('accepts multiple definitions if only one is exported', () => {
          const source = `
          import React from 'React';
          class ComponentA extends React.Component {};
          export class ComponentB extends React.Component {};
        `;
          const result = findComponentsInSource(source);

          expect(Array.isArray(result)).toBe(true);
          expect(result).toHaveLength(1);
          expect(result[0].node.type).toBe('ClassDeclaration');
        });
      });
    });
  });
});
