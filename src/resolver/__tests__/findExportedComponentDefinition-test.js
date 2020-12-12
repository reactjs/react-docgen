/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  getParser,
  parse as parseSource,
  statement,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';
import findExportedComponentDefinition from '../findExportedComponentDefinition';

describe('findExportedComponentDefinition', () => {
  function parse(source, importer = noopImporter) {
    return findExportedComponentDefinition(
      parseSource(source),
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
        const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = Component;
        `;

        expect(parse(source)).toBeDefined();
      });

      it('finds React.createClass with hoc', () => {
        const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = hoc(Component);
        `;

        expect(parse(source)).toBeDefined();
      });

      it('finds React.createClass with hoc and args', () => {
        const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = hoc(arg1, arg2)(Component);
        `;

        expect(parse(source)).toBeDefined();
      });

      it('finds React.createClass with two hocs', () => {
        const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = hoc2(arg2b, arg2b)(
            hoc1(arg1a, arg2a)(Component)
          );
        `;

        expect(parse(source)).toBeDefined();
      });

      it('finds React.createClass with three hocs', () => {
        const source = `
          var React = require("React");
          var Component = React.createClass({});
          module.exports = hoc3(arg3a, arg3b)(
            hoc2(arg2b, arg2b)(
              hoc1(arg1a, arg2a)(Component)
            )
          );
        `;

        expect(parse(source)).toBeDefined();
      });

      it('finds React.createClass, independent of the var name', () => {
        const source = `
          var R = require("React");
          var Component = R.createClass({});
          module.exports = Component;
        `;

        expect(parse(source)).toBeDefined();
      });

      it('does not process X.createClass of other modules', () => {
        const source = `
          var R = require("NoReact");
          var Component = R.createClass({});
          module.exports = Component;
        `;

        expect(parse(source)).toBeUndefined();
      });

      it('resolves an imported variable to React.createClass', () => {
        const source = `
          import Component from 'createClass';
          module.exports = Component;
        `;

        expect(parse(source, mockImporter)).toBeDefined();
      });
    });

    describe('class definitions', () => {
      it('finds class declarations', () => {
        const source = `
          var React = require("React");
          class Component extends React.Component {}
          module.exports = Component;
        `;

        const result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

      it('finds class expression', () => {
        const source = `
          var React = require("React");
          var Component = class extends React.Component {}
          module.exports = Component;
        `;

        const result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');
      });

      it('finds class definition, independent of the var name', () => {
        const source = `
          var R = require("React");
          class Component extends R.Component {}
          module.exports = Component;
        `;

        const result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

      it('resolves an imported variable to class declaration', () => {
        const source = `
          import Component from 'classDec';
          module.exports = Component;
        `;

        const result = parse(source, mockImporter);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

      it('resolves an imported variable to class expression', () => {
        const source = `
          import Component from 'classExpr';
          module.exports = Component;
        `;

        const result = parse(source, mockImporter);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassExpression');
      });
    });

    describe('stateless components', () => {
      it('finds stateless component with JSX', () => {
        const source = `
          var React = require("React");
          var Component = () => <div />;
          module.exports = Component;
        `;

        expect(parse(source)).toBeDefined();
      });

      it('finds stateless components with React.createElement, independent of the var name', () => {
        const source = `
          var R = require("React");
          var Component = () => R.createElement('div', {});
          module.exports = Component;
        `;

        expect(parse(source)).toBeDefined();
      });

      it('does not process X.createElement of other modules', () => {
        const source = `
          var R = require("NoReact");
          var Component = () => R.createElement({});
          module.exports = Component;
        `;

        expect(parse(source)).toBeUndefined();
      });

      it('resolves an imported stateless component with JSX', () => {
        const source = `
          import Component from 'statelessJsx';
          module.exports = Component;
        `;

        expect(parse(source, mockImporter)).toBeDefined();
      });

      it('resolves an imported stateless component with React.createElement', () => {
        const source = `
          import Component from 'statelessCreateElement';
          module.exports = Component;
        `;

        expect(parse(source, mockImporter)).toBeDefined();
      });
    });

    describe('module.exports = <C>; / exports.foo = <C>;', () => {
      describe('React.createClass', () => {
        it('finds assignments to exports', () => {
          const source = `
            var R = require("React");
            var Component = R.createClass({});
            exports.foo = 42;
            exports.Component = Component;
          `;

          expect(parse(source)).toBeDefined();
        });

        it('errors if multiple components are exported', () => {
          const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          let source = `
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

        it('supports imported components', () => {
          const source = `
            import Component from 'createClass';
            exports.ComponentB = Component;
          `;

          expect(parse(source, mockImporter)).toBeDefined();
        });
      });

      describe('class definition', () => {
        it('finds assignments to exports', () => {
          const source = `
            var R = require("React");
            class Component extends R.Component {}
            exports.foo = 42;
            exports.Component = Component;
          `;

          const result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassDeclaration');
        });

        it('errors if multiple components are exported', () => {
          const source = `
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentA = ComponentA;
            exports.ComponentB = ComponentB;
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          let source = `
            var R = require("React");
            class ComponentA extends R.Component {}
            class ComponentB extends R.Component {}
            exports.ComponentB = ComponentB;
          `;

          let result = parse(source);
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

        it('supports imported components', () => {
          const source = `
            import Component from 'classDec';
            exports.ComponentB = Component;
          `;

          const result = parse(source, mockImporter);
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
          let source = `
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
          let source = `
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
          const source = `
            import React, { createElement } from "React"
            var Component = React.createClass({})
            export default React.createClass({});
          `;

          expect(parse(source)).toBeDefined();
        });

        it('supports imported components', () => {
          const source = `
            import Component from 'createClass';
            export default Component;
          `;

          expect(parse(source, mockImporter)).toBeDefined();
        });
      });

      describe('class definition', () => {
        it('finds default export', () => {
          let source = `
            import React from 'React';
            class Component extends React.Component {}
            export default Component;
          `;

          let result = parse(source);
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

        it('finds default export with hoc', () => {
          const source = `
            import React from 'React';
            class Component extends React.Component {}
            export default hoc(Component);
          `;

          const result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassDeclaration');
        });

        it('finds default export with hoc and args', () => {
          const source = `
            import React from 'React';
            class Component extends React.Component {}
            export default hoc(arg1, arg2)(Component);
          `;

          const result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassDeclaration');
        });

        it('finds default export with two hocs', () => {
          const source = `
            import React from 'React';
            class Component extends React.Component {}
            export default hoc2(arg2b, arg2b)(
              hoc1(arg1a, arg2a)(Component)
            );
          `;

          const result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassDeclaration');
        });

        it('errors if multiple components are exported', () => {
          let source = `
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
          const source = `
            import React from 'React';
            var Component = class extends React.Component {};
            export default class ComponentB extends React.Component{};
          `;

          const result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassDeclaration');
        });

        it('supports imported components', () => {
          const source = `
            import Component from 'classDec';
            export default Component;
          `;

          const result = parse(source, mockImporter);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassDeclaration');
        });
      });
    });

    describe('export var foo = <C>, ...;', () => {
      describe('React.createClass', () => {
        it('finds named exports', () => {
          let source = `
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
          let source = `
            var R = require("React");
            export var ComponentA = R.createClass({}),
              ComponentB = R.createClass({});
          `;

          expect(() => parse(source)).toThrow();

          source = `
            var R = require("React");
            export var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentB};
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            export let ComponentB = R.createClass({});
          `;

          expect(parse(source)).toBeDefined();
        });

        it('supports imported components', () => {
          const source = `
            import Component from 'createClass';
            export let ComponentB = Component;
          `;

          expect(parse(source, mockImporter)).toBeDefined();
        });
      });

      describe('class definition', () => {
        it('finds named exports', () => {
          let source = `
            import React from 'React';
            export var somethingElse = 42,
              Component = class extends React.Component {};
          `;
          let result = parse(source);
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
          let source = `
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
          const source = `
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = class extends React.Component {};
          `;
          const result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassExpression');
        });

        it('supports imported components', () => {
          const source = `
            import Component from 'classDec';
            export let ComponentB = Component;
          `;

          const result = parse(source, mockImporter);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassDeclaration');
        });
      });

      describe('stateless components', () => {
        it('finds named exports', () => {
          let source = `
            import React from 'React';
            export var somethingElse = 42,
              Component = () => <div />;
          `;
          let result = parse(source);
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
          let source = `
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
          const source = `
            import React from 'React';
            var ComponentA  = class extends React.Component {}
            export var ComponentB = function() { return <div />; };
          `;
          const result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('FunctionExpression');
        });

        it('supports imported components', () => {
          let source = `
            import Component from 'statelessJsx';
            export var ComponentA = Component;
          `;

          let result = parse(source, mockImporter);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');

          source = `
            import Component from 'statelessCreateElement';
            export var ComponentB = Component;
          `;

          result = parse(source, mockImporter);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');
        });
      });
    });

    describe('export {<C>};', () => {
      describe('React.createClass', () => {
        it('finds exported specifiers', () => {
          let source = `
            var React = require("React");
            var foo = 42;
            var Component = React.createClass({});
            export {foo, Component}
          `;
          expect(parse(source)).toBeDefined();

          source = `
            import React from "React"
            var foo = 42;
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
          const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA as foo, ComponentB};
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          const source = `
            var R = require("React");
            var ComponentA = R.createClass({});
            var ComponentB = R.createClass({});
            export {ComponentA}
          `;

          expect(parse(source)).toBeDefined();
        });

        it('supports imported components', () => {
          const source = `
            import Component from 'createClass';
            export { Component };
          `;

          expect(parse(source, mockImporter)).toBeDefined();
        });
      });

      describe('class definition', () => {
        it('finds exported specifiers', () => {
          let source = `
            import React from 'React';
            var foo = 42;
            var Component = class extends React.Component {};
            export {foo, Component};
          `;
          let result = parse(source);
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
          const source = `
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA as foo, ComponentB};
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          const source = `
            import React from 'React';
            var ComponentA = class extends React.Component {};
            var ComponentB = class extends React.Component {};
            export {ComponentA};
          `;
          const result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassExpression');
        });

        it('supports imported components', () => {
          const source = `
            import Component from 'classDec';
            export { Component };
          `;

          const result = parse(source, mockImporter);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ClassDeclaration');
        });
      });

      describe('stateless components', () => {
        it('finds exported specifiers', () => {
          let source = `
            import React from 'React';
            var foo = 42;
            function Component() { return <div />; }
            export {foo, Component};
          `;
          let result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('FunctionDeclaration');

          source = `
            import React from 'React';
            var foo = 42;
            var Component = () => <div />;
            export {Component, foo};
          `;
          result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');

          source = `
            import React from 'React';
            var foo = 42;
            var baz = 21;
            var Component = function () { return <div />; }
            export {foo, Component as bar, baz};
          `;
          result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('FunctionExpression');
        });

        it('errors if multiple components are exported', () => {
          const source = `
            import React from 'React';
            var ComponentA = () => <div />;
            function ComponentB() { return <div />; }
            export {ComponentA as foo, ComponentB};
          `;

          expect(() => parse(source)).toThrow();
        });

        it('accepts multiple definitions if only one is exported', () => {
          const source = `
            import React from 'React';
            var ComponentA = () => <div />;
            var ComponentB = () => <div />;
            export {ComponentA};
          `;
          const result = parse(source);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');
        });

        it('supports imported components', () => {
          let source = `
            import Component from 'statelessJsx';
            export { Component as ComponentA };
          `;

          let result = parse(source, mockImporter);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');

          source = `
            import Component from 'statelessCreateElement';
            export { Component as ComponentB };
          `;

          result = parse(source, mockImporter);
          expect(result).toBeDefined();
          expect(result.node.type).toBe('ArrowFunctionExpression');
        });
      });
    });

    // Only applies to classes
    describe('export <C>;', () => {
      it('finds named exports', () => {
        const source = `
          import React from 'React';
          export var foo = 42;
          export class Component extends React.Component {};
        `;
        const result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });

      it('errors if multiple components are exported', () => {
        const source = `
          import React from 'React';
          export class ComponentA extends React.Component {};
          export class ComponentB extends React.Component {};
        `;

        expect(() => parse(source)).toThrow();
      });

      it('accepts multiple definitions if only one is exported', () => {
        const source = `
          import React from 'React';
          class ComponentA extends React.Component {};
          export class ComponentB extends React.Component {};
        `;
        const result = parse(source);
        expect(result).toBeDefined();
        expect(result.node.type).toBe('ClassDeclaration');
      });
    });
  });
});
