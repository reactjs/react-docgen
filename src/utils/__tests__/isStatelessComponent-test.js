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


jest.disableAutomock();

describe('isStatelessComponent', () => {
  var isStatelessComponent;
  var statement, parse;

  beforeEach(() => {
    isStatelessComponent = require('../isStatelessComponent').default;
    ({statement, parse} = require('../../../tests/utils'));
  });

  const componentIdentifiers = {
    'JSX': '<div />',
    'React.createElement': 'React.createElement("div", null)',
    'React.cloneElement': 'React.cloneElement(children, null)',
    'React.Children.only()': 'React.Children.only(children, null)',
  };

  const componentStyle = {
    'ArrowExpression': [
      (name, expr) => `var ${name} = () => (${expr});`,
      ['declarations', 0, 'init'],
    ],
    'ArrowBlock': [
      (name, expr) => `var ${name} = () => { return (${expr}); };`,
      ['declarations', 0, 'init'],
    ],
    'FunctionExpression': [
      (name, expr) => `var ${name} = function () { return (${expr}); }`,
      ['declarations', 0, 'init'],
    ],
    'FunctionDeclaration': [
      (name, expr) => `function ${name} () { return (${expr}); }`,
      [],
    ],
  };

  const modifiers = {
    'default': (expr) => expr,
    'conditional consequent': (expr) => `x ? ${expr} : null`,
    'conditional alternate': (expr) => `x ? null : ${expr}`,
    'OR left': (expr) => `${expr} || null`,
    'AND right': (expr) => `x && ${expr}`,
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

  Object.keys(componentStyle).forEach((name) => {
    cases[`with ${name} reference`] = [
      (expr, componentFactory) => `
        var React = require('react');
        ${componentStyle[name][0]('jsx', expr)}
        ${componentFactory('Foo', 'jsx()')}
      `,
      ['body', 2],
    ]
  });

  const negativeModifiers = {
    'nested ArrowExpression': (expr) => `() => ${expr}`,
    'nested ArrowBlock': (expr) => `() => { return ${expr} }`,
    'nested FunctionExpression': (expr) => `function () { return ${expr} }`,
  };

  Object.keys(cases).forEach((name) => {
    const [caseFactory, caseSelector] = cases[name];

    describe(name, () => {
      Object.keys(componentIdentifiers).forEach((componentIdentifierName) => {

        const returnExpr = componentIdentifiers[componentIdentifierName];
        describe(componentIdentifierName, () => {
          Object.keys(componentStyle).forEach((componentName) => {
            const [componentFactory, componentSelector] = componentStyle[componentName];
            describe(componentName, () => {

              Object.keys(modifiers).forEach((modifierName) => {
                const modifierFactory = modifiers[modifierName];

                it(modifierName, () => {
                  const code = caseFactory(modifierFactory(returnExpr), componentFactory);
                  const def = parse(code).get(...caseSelector, ...componentSelector);
                  expect(isStatelessComponent(def)).toBe(true);
                });
              });

              Object.keys(negativeModifiers).forEach((modifierName) => {
                const modifierFactory = negativeModifiers[modifierName];

                it(modifierName, () => {
                  const code = caseFactory(modifierFactory(returnExpr), componentFactory);
                  const def = parse(code).get(...caseSelector, ...componentSelector);
                  expect(isStatelessComponent(def)).toBe(false);
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
      var def = parse(`
        var AlphaBetters = require('react');
        var Foo = () => AlphaBetters.createElement("div", null);
      `).get('body', 1).get('declarations', [0]).get('init');

      expect(isStatelessComponent(def)).toBe(true);
    });
  });

  describe('Stateless Function Components inside module pattern', () => {
    it('', () => {
      var def = parse(`
        var React = require('react');
        var Foo = {
          Bar() { return <div />; },
          Baz: function() { return React.createElement('div'); },
          ['hello']: function() { return React.createElement('div'); },
          render() { return 7; },
          world: function({ children }) { return React.cloneElement(children, {}); },
        }
      `).get('body', 1).get('declarations', 0).get('init');

      var bar = def.get('properties', 0);
      var baz = def.get('properties', 1);
      var hello = def.get('properties', 2);
      var render = def.get('properties', 3);
      var world = def.get('properties', 4);

      expect(isStatelessComponent(bar)).toBe(true);
      expect(isStatelessComponent(baz)).toBe(true);
      expect(isStatelessComponent(hello)).toBe(true);
      expect(isStatelessComponent(render)).toBe(false);
      expect(isStatelessComponent(world)).toBe(true);
    });
  });

  describe('is not overzealous', () => {
    it('does not accept declarations with a render method', () => {
      var def = statement(`
        class Foo {
          render() {
            return <div />;
          }
        }
      `);
      expect(isStatelessComponent(def)).toBe(false);
    });

    it('does not accept React.Component classes', () => {
      var def = parse(`
        var React = require('react');
        class Foo extends React.Component {
          render() {
            return <div />;
          }
        }
      `).get('body', 1);

      expect(isStatelessComponent(def)).toBe(false);
    });

    it('does not accept React.createClass calls', () => {
      var def = statement(`
        React.createClass({
          render() {
            return <div />;
          }
        });
      `);

      expect(isStatelessComponent(def)).toBe(false);
    });
  });

  describe('resolving return values', () => {
    function test(desc, code) {
      it(desc, () => {
        var def = parse(code).get('body', 1);

        expect(isStatelessComponent(def)).toBe(true);
      });
    }

    it('does not see ifs as separate block', () => {
      var def = statement(`
        function Foo (props) {
          if (x) {
            return <div />;
          }
        }
      `);

      expect(isStatelessComponent(def)).toBe(true);
    });

    test('handles simple resolves', `
      var React = require('react');
      function Foo (props) {
        function bar() {
          return React.createElement("div", props);
        }

        return bar();
      }
    `);

    test('handles reference resolves', `
      var React = require('react');
      function Foo (props) {
        var result = bar();

        return result;

        function bar() {
          return <div />;
        }
      }
    `);

    test('handles shallow member call expression resolves', `
      var React = require('react');
      function Foo (props) {
        var shallow = {
          shallowMember() {
            return <div />;
          }
        };

        return shallow.shallowMember();
      }
    `);

    test('handles deep member call expression resolves', `
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
    `);

    test('handles external reference member call expression resolves', `
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
    `);

    test('handles all sorts of JavaScript things', `
      var React = require('react');
      function Foo (props) {
        var external = {
          member: () => <div />
        };
        var obj = {external};

        return obj.external.member();
      }
    `);
  });
});
