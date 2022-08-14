import type { NodePath } from '@babel/traverse';
import { parse, noopImporter, makeMockImporter } from '../../../tests/utils';
import findAllExportedComponentDefinitions from '../findAllExportedComponentDefinitions';

describe('findAllExportedComponentDefinitions', () => {
  function findComponentsInSource(
    source: string,
    importer = noopImporter,
  ): NodePath[] {
    return findAllExportedComponentDefinitions(
      parse(source, {}, importer, true),
    );
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
      it('finds React.createClass', () => {
        const result = findComponentsInSource(`
          var React = require("React");
          var Component = React.createClass({});
          module.exports = Component;
        `);

        expect(result).toMatchSnapshot();
      });

      it('finds React.createClass, independent of the var name', () => {
        const result = findComponentsInSource(`
          var R = require("React");
          var Component = R.createClass({});
          module.exports = Component;
        `);

        expect(result).toMatchSnapshot();
      });

      it('does not process X.createClass of other modules', () => {
        const result = findComponentsInSource(`
          var R = require("NoReact");
          var Component = R.createClass({});
          module.exports = Component;
        `);

        expect(result).toMatchSnapshot();
      });

      it('resolves an imported variable to React.createClass', () => {
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
      it('finds class declarations', () => {
        const result = findComponentsInSource(`
          var React = require("React");
          class Component extends React.Component {}
          module.exports = Component;
        `);

        expect(result).toMatchSnapshot();
      });

      it('finds class expression', () => {
        const result = findComponentsInSource(`
          var React = require("React");
          var Component = class extends React.Component {}
          module.exports = Component;
        `);

        expect(result).toMatchSnapshot();
      });

      it('finds class definition, independent of the var name', () => {
        const result = findComponentsInSource(`
          var R = require("React");
          class Component extends R.Component {}
          module.exports = Component;
        `);

        expect(result).toMatchSnapshot();
      });

      it('resolves an imported variable to class declaration', () => {
        const result = findComponentsInSource(
          `
          import Component from 'classDec';
          module.exports = Component;
        `,
          mockImporter,
        );

        expect(result).toMatchSnapshot();
      });

      it('resolves an imported variable to class expression', () => {
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
      it('finds stateless component with JSX', () => {
        const result = findComponentsInSource(`
          var React = require("React");
          var Component = () => <div />;
          module.exports = Component;
        `);

        expect(result).toMatchSnapshot();
      });

      it('finds stateless components with React.createElement, independent of the var name', () => {
        const result = findComponentsInSource(`
          var R = require("React");
          var Component = () => R.createElement('div', {});
          module.exports = Component;
        `);

        expect(result).toMatchSnapshot();
      });

      it('does not process X.createElement of other modules', () => {
        const result = findComponentsInSource(`
          var R = require("NoReact");
          var Component = () => R.createElement({});
          module.exports = Component;
        `);

        expect(result).toMatchSnapshot();
      });

      it('resolves an imported stateless component with JSX', () => {
        const result = findComponentsInSource(
          `
          import Component from 'statelessJsx';
          module.exports = Component;
        `,
          mockImporter,
        );

        expect(result).toMatchSnapshot();
      });

      it('resolves an imported stateless component with React.createElement', () => {
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
      it('finds forwardRef components', () => {
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

      it('finds none inline forwardRef components', () => {
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

      it('resolves an imported forwardRef component', () => {
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
        it('finds assignments to exports', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var Component = R.createClass({});
            exports.foo = 42;
            exports.Component = Component;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple exported components', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple exported components with hocs', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentA = hoc(ComponentA);
            exports.ComponentB = hoc(ComponentB);
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components on export', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentB = ComponentB;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            module.exports = ComponentB;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported components only once', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentA;
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
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
        it('finds assignments to exports', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            class Component extends R.Component {}
            exports.foo = 42;
            exports.Component = Component;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple exported components', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components on export', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentB = ComponentB;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            module.exports = ComponentB;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported components only once', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            class ComponentA extends R.Component {}
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentA;
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
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
        it('finds reassigned default export', () => {
          const result = findComponentsInSource(`
            var React = require("React");
            var Component = React.createClass({});
            export default Component
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds default export', () => {
          const result = findComponentsInSource(`
            var React = require("React");
            export default React.createClass({});
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple exported components with export var', () => {
          const result = findComponentsInSource(`
            import React, { createElement } from "React"
            export var Component = React.createClass({});
            export default React.createClass({});
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple exported components with named export', () => {
          const result = findComponentsInSource(`
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export {Component};
            export default React.createClass({});
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export default React.createClass({});
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
          const result = findComponentsInSource(
            `import Component from 'createClass';
             export default Component;`,
            mockImporter,
          );

          expect(result).toMatchSnapshot();
        });
      });

      describe('class definition', () => {
        it('finds default export', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            class Component extends React.Component {}
            export default Component;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds default export inline', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export default class Component extends React.Component {};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple exported components with export var', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var Component = class extends React.Component {};
            export default class ComponentB extends React.Component{};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple exported components with named export', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var Component = class extends React.Component {};
            export {Component};
            export default class ComponentB extends React.Component{};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var Component = class extends React.Component {};
            export default class ComponentB extends React.Component{};
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
          const result = findComponentsInSource(
            `import Component from 'classDec';
             export default Component;`,
            mockImporter,
          );

          expect(result).toMatchSnapshot();
        });
      });

      describe('forwardRef components', () => {
        it('finds forwardRef components', () => {
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

        it('finds none inline forwardRef components', () => {
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

        it('supports imported components', () => {
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
        it('finds named exports 1', () => {
          const result = findComponentsInSource(`
            var React = require("React");
            export var somethingElse = 42, Component = React.createClass({});
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds named exports 2', () => {
          const result = findComponentsInSource(`
            var React = require("React");
            export let Component = React.createClass({}), somethingElse = 42;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds named exports 3', () => {
          const result = findComponentsInSource(`
            var React = require("React");
            export const something = 21,
             Component = React.createClass({}),
             somethingElse = 42;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds named exports 4', () => {
          const result = findComponentsInSource(`
            var React = require("React");
            export var somethingElse = function() {};
            export let Component = React.createClass({});
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            export var ComponentA = R.createClass({}),
              ComponentB = R.createClass({});
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components with separate export statements', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            export var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentB};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            export let ComponentB = R.createClass({});
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
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
        it('finds named exports 1', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var somethingElse = 42,
              Component = class extends React.Component {};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds named exports 2', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export let Component = class extends React.Component {},
              somethingElse = 42;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds named exports 3', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export const something = 21,
              Component = class extends React.Component {},
              somethingElse = 42;
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds named exports 4', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var somethingElse = function() {};
            export let Component  = class extends React.Component {};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var ComponentA  = class extends React.Component {};
            export var ComponentB  = class extends React.Component {};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components with assigned component', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var ComponentA = class extends React.Component {};
            var ComponentB  = class extends React.Component {};
            export {ComponentB};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = class extends React.Component {};
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
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
        it('finds named exports 1', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var somethingElse = 42,
              Component = () => <div />;
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components 2', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export let Component = () => <div />,
              somethingElse = 42;
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components 3', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export const something = 21,
              Component = () => <div />,
              somethingElse = 42;
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components 4', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var somethingElse = function() {};
            export let Component = () => <div />
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var ComponentA = () => <div />
            export var ComponentB = () => <div />
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components with named export', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var ComponentA = () => <div />
            var ComponentB  = () => <div />
            export {ComponentB};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = function() { return <div />; };
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
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
        it('finds forwardRef components', () => {
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

        it('supports imported components', () => {
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
        it('finds exported specifiers', () => {
          const result = findComponentsInSource(`
            var React = require("React");
            var foo = 42;
            var Component = React.createClass({});
            export {foo, Component}
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported specifiers 2', () => {
          const result = findComponentsInSource(`
            import React from "React"
            var foo = 42;
            var Component = React.createClass({});
            export {Component, foo}
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported specifiers 3', () => {
          const result = findComponentsInSource(`
            import React, { createElement } from "React"
            var foo = 42;
            var baz = 21;
            var Component = React.createClass({});
            export {foo, Component as bar, baz}
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA as foo, ComponentB};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components with hocs', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = hoc(R.createClass({}));
            var ComponentB = hoc(R.createClass({}));
            export {ComponentA as foo, ComponentB};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA}
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported components only once', () => {
          const result = findComponentsInSource(`
            var R = require("React");
            var ComponentA = R.createClass({});
            export {ComponentA as foo, ComponentA as bar};
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
          const result = findComponentsInSource(
            `import Component from 'createClass';
             export { Component, Component as ComponentB };`,
            mockImporter,
          );

          expect(result).toMatchSnapshot();
        });
      });

      describe('class definition', () => {
        it('finds exported specifiers 1', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var Component = class extends React.Component {};
            export {foo, Component};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported specifiers 2', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var Component = class extends React.Component {};
            export {Component, foo};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported specifiers 3', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = class extends React.Component {};
            export {foo, Component as bar, baz};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA as foo, ComponentB};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components with hocs', () => {
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

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported components only once', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA as foo, ComponentA as bar};
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
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
        it('finds exported specifiers 1', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            function Component() { return <div />; }
            export {foo, Component};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported specifiers 2', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var Component = () => <div />;
            export {Component, foo};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported specifiers 3', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = function () { return <div />; }
            export {foo, Component as bar, baz};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = () => <div />;
            function ComponentB() { return <div />; }
            export {ComponentA as foo, ComponentB};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = () => <div />;
            var ComponentB = () => <div />;
            export {ComponentA};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds exported components only once', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            var ComponentA = () => <div />;
            var ComponentB = () => <div />;
            export {ComponentA as foo, ComponentA as bar};
          `);

          expect(result).toMatchSnapshot();
        });

        it('supports imported components', () => {
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
        it('finds forwardRef components', () => {
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

        it('supports imported components', () => {
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
        it('finds named exports', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var foo = 42;
            export class Component extends React.Component {};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export class ComponentA extends React.Component {};
            export class ComponentB extends React.Component {};
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            class ComponentA extends React.Component {};
            export class ComponentB extends React.Component {};
          `);

          expect(result).toMatchSnapshot();
        });
      });

      describe('function declaration', () => {
        it('finds named exports', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export var foo = 42;
            export function Component() { return <div />; };
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds multiple components', () => {
          const result = findComponentsInSource(`
            import React from 'React';
            export function ComponentA() { return <div />; };
            export function ComponentB() { return <div />; };
          `);

          expect(result).toMatchSnapshot();
        });

        it('finds only exported components', () => {
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
