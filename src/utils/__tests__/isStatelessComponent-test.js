/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parse, statement, noopImporter } from '../../../tests/utils';
import isStatelessComponent from '../isStatelessComponent';

describe('isStatelessComponent', () => {
  const componentIdentifiers = {
    JSX: '<div />',
    JSXFragment: '<></>',
    'React.createElement': 'React.createElement("div", null)',
    'React.cloneElement': 'React.cloneElement(children, null)',
    'React.Children.only()': 'React.Children.only(children, null)',
  };

  const componentStyle = {
    ArrowExpression: [
      (name, expr) => `var ${name} = () => (${expr});`,
      ['declarations', 0, 'init'],
    ],
    ArrowBlock: [
      (name, expr) => `var ${name} = () => { return (${expr}); };`,
      ['declarations', 0, 'init'],
    ],
    FunctionExpression: [
      (name, expr) => `var ${name} = function () { return (${expr}); }`,
      ['declarations', 0, 'init'],
    ],
    FunctionDeclaration: [
      (name, expr) => `function ${name} () { return (${expr}); }`,
      [],
    ],
  };

  const modifiers = {
    default: expr => expr,
    'conditional consequent': expr => `x ? ${expr} : null`,
    'conditional alternate': expr => `x ? null : ${expr}`,
    'OR left': expr => `${expr} || null`,
    'AND right': expr => `x && ${expr}`,
  };

  const cases = {
    'no reference': [
      (expr, componentFactory) => `
        var React = require('react');
        ${componentFactory('Foo', expr)}
      `,
      ['body', 1],
    ],
    'with Identifier reference': [
      (expr, componentFactory) => `
        var React = require('react');
        var jsx = (${expr});
        ${componentFactory('Foo', 'jsx')}
      `,
      ['body', 2],
    ],
  };

  Object.keys(componentStyle).forEach(name => {
    cases[`with ${name} reference`] = [
      (expr, componentFactory) => `
        var React = require('react');
        ${componentStyle[name][0]('jsx', expr)}
        ${componentFactory('Foo', 'jsx()')}
      `,
      ['body', 2],
    ];
  });

  const negativeModifiers = {
    'nested ArrowExpression': expr => `() => ${expr}`,
    'nested ArrowBlock': expr => `() => { return ${expr} }`,
    'nested FunctionExpression': expr => `function () { return ${expr} }`,
  };

  Object.keys(cases).forEach(name => {
    const [caseFactory, caseSelector] = cases[name];

    describe(name, () => {
      Object.keys(componentIdentifiers).forEach(componentIdentifierName => {
        const returnExpr = componentIdentifiers[componentIdentifierName];
        describe(componentIdentifierName, () => {
          Object.keys(componentStyle).forEach(componentName => {
            const [componentFactory, componentSelector] = componentStyle[
              componentName
            ];
            describe(componentName, () => {
              Object.keys(modifiers).forEach(modifierName => {
                const modifierFactory = modifiers[modifierName];

                it(modifierName, () => {
                  const code = caseFactory(
                    modifierFactory(returnExpr),
                    componentFactory,
                  );
                  const def = parse(code).get(
                    ...caseSelector,
                    ...componentSelector,
                  );
                  expect(isStatelessComponent(def, noopImporter)).toBe(true);
                });
              });

              Object.keys(negativeModifiers).forEach(modifierName => {
                const modifierFactory = negativeModifiers[modifierName];

                it(modifierName, () => {
                  const code = caseFactory(
                    modifierFactory(returnExpr),
                    componentFactory,
                  );
                  const def = parse(code).get(
                    ...caseSelector,
                    ...componentSelector,
                  );
                  expect(isStatelessComponent(def, noopImporter)).toBe(false);
                });
              });
            });
          });
        });
      });
    });
  });

  describe('Stateless Function Components with React.createElement', () => {
    it('accepts different name than React', () => {
      const def = parse(`
        var AlphaBetters = require('react');
        var Foo = () => AlphaBetters.createElement("div", null);
      `)
        .get('body', 1)
        .get('declarations', [0])
        .get('init');

      expect(isStatelessComponent(def, noopImporter)).toBe(true);
    });
  });

  describe('Stateless Function Components inside module pattern', () => {
    it('', () => {
      const def = parse(`
        var React = require('react');
        var Foo = {
          Bar() { return <div />; },
          Baz: function() { return React.createElement('div'); },
          ['hello']: function() { return React.createElement('div'); },
          render() { return 7; },
          world: function({ children }) { return React.cloneElement(children, {}); },
        }
      `)
        .get('body', 1)
        .get('declarations', 0)
        .get('init');

      const bar = def.get('properties', 0);
      const baz = def.get('properties', 1);
      const hello = def.get('properties', 2);
      const render = def.get('properties', 3);
      const world = def.get('properties', 4);

      expect(isStatelessComponent(bar, noopImporter)).toBe(true);
      expect(isStatelessComponent(baz, noopImporter)).toBe(true);
      expect(isStatelessComponent(hello, noopImporter)).toBe(true);
      expect(isStatelessComponent(render, noopImporter)).toBe(false);
      expect(isStatelessComponent(world, noopImporter)).toBe(true);
    });
  });

  describe('is not overzealous', () => {
    it('does not accept declarations with a render method', () => {
      const def = statement(`
        class Foo {
          render() {
            return <div />;
          }
        }
      `);
      expect(isStatelessComponent(def, noopImporter)).toBe(false);
    });

    it('does not accept React.Component classes', () => {
      const def = parse(`
        var React = require('react');
        class Foo extends React.Component {
          render() {
            return <div />;
          }
        }
      `).get('body', 1);

      expect(isStatelessComponent(def, noopImporter)).toBe(false);
    });

    it('does not accept React.createClass calls', () => {
      const def = statement(`
        React.createClass({
          render() {
            return <div />;
          }
        });
      `);

      expect(isStatelessComponent(def, noopImporter)).toBe(false);
    });
  });

  describe('resolving return values', () => {
    function test(desc, code) {
      it(desc, () => {
        const def = parse(code).get('body', 1);

        expect(isStatelessComponent(def, noopImporter)).toBe(true);
      });
    }

    it('does not see ifs as separate block', () => {
      const def = statement(`
        function Foo (props) {
          if (x) {
            return <div />;
          }
        }
      `);

      expect(isStatelessComponent(def, noopImporter)).toBe(true);
    });

    it('handles recursive function calls', () => {
      const def = statement(`
        function Foo (props) {
          return props && Foo(props);
        }
      `);

      expect(isStatelessComponent(def, noopImporter)).toBe(false);
    });

    test(
      'handles simple resolves',
      `
      var React = require('react');
      function Foo (props) {
        function bar() {
          return React.createElement("div", props);
        }

        return bar();
      }
    `,
    );

    test(
      'handles reference resolves',
      `
      var React = require('react');
      function Foo (props) {
        var result = bar();

        return result;

        function bar() {
          return <div />;
        }
      }
    `,
    );

    test(
      'handles shallow member call expression resolves',
      `
      var React = require('react');
      function Foo (props) {
        var shallow = {
          shallowMember() {
            return <div />;
          }
        };

        return shallow.shallowMember();
      }
    `,
    );

    test(
      'handles deep member call expression resolves',
      `
      var React = require('react');
      function Foo (props) {
        var obj = {
          deep: {
            member() {
              return <div />;
            }
          }
        };

        return obj.deep.member();
      }
    `,
    );

    test(
      'handles external reference member call expression resolves',
      `
      var React = require('react');
      function Foo (props) {
        var member = () => <div />;
        var obj = {
          deep: {
            member: member
          }
        };

        return obj.deep.member();
      }
    `,
    );

    test(
      'handles all sorts of JavaScript things',
      `
      var React = require('react');
      function Foo (props) {
        var external = {
          member: () => <div />
        };
        var obj = {external};

        return obj.external.member();
      }
    `,
    );
  });
});
