import { parse } from '../../../tests/utils';
import isStatelessComponent from '../isStatelessComponent.js';
import { describe, expect, test } from 'vitest';

describe('isStatelessComponent', () => {
  test('accepts jsx', () => {
    const def = parse(`
        var React = require('react');
        var Foo = () => <div />;
      `)
      .get('body')[1]
      .get('declarations')[0]
      .get('init');

    expect(isStatelessComponent(def)).toBe(true);
  });

  test('accepts jsx fragment', () => {
    const def = parse(`
        var React = require('react');
        var Foo = () => <></>;
      `)
      .get('body')[1]
      .get('declarations')[0]
      .get('init');

    expect(isStatelessComponent(def)).toBe(true);
  });

  test('accepts createElement', () => {
    const def = parse(`
        var React = require('react');
        var Foo = () => React.createElement("div", null);
      `)
      .get('body')[1]
      .get('declarations')[0]
      .get('init');

    expect(isStatelessComponent(def)).toBe(true);
  });

  test('accepts cloneElement', () => {
    const def = parse(`
        var React = require('react');
        var Foo = () => React.cloneElement("div", null);
      `)
      .get('body')[1]
      .get('declarations')[0]
      .get('init');

    expect(isStatelessComponent(def)).toBe(true);
  });

  test('accepts React.Children.only', () => {
    const def = parse(`
        var React = require('react');
        var Foo = () => React.Children.only(children);
      `)
      .get('body')[1]
      .get('declarations')[0]
      .get('init');

    expect(isStatelessComponent(def)).toBe(true);
  });

  test('accepts React.Children.map', () => {
    const def = parse(`
        var React = require('react');
        var Foo = () => React.Children.map(children, child => child);
      `)
      .get('body')[1]
      .get('declarations')[0]
      .get('init');

    expect(isStatelessComponent(def)).toBe(true);
  });

  test('accepts different name than React', () => {
    const def = parse(`
        var AlphaBetters = require('react');
        var Foo = () => AlphaBetters.createElement("div", null);
      `)
      .get('body')[1]
      .get('declarations')[0]
      .get('init');

    expect(isStatelessComponent(def)).toBe(true);
  });

  test('Stateless Function Components inside module pattern', () => {
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
      .get('body')[1]
      .get('declarations')[0]
      .get('init');

    const bar = def.get('properties')[0];
    const baz = def.get('properties')[1].get('value');
    const hello = def.get('properties')[2].get('value');
    const render = def.get('properties')[3];
    const world = def.get('properties')[4].get('value');

    expect(isStatelessComponent(bar)).toBe(true);
    expect(isStatelessComponent(baz)).toBe(true);
    expect(isStatelessComponent(hello)).toBe(true);
    expect(isStatelessComponent(render)).toBe(false);
    expect(isStatelessComponent(world)).toBe(true);
  });

  describe('is not overzealous', () => {
    test('does not accept declarations with a render method', () => {
      const def = parse.statement(`
        class Foo {
          render() {
            return <div />;
          }
        }
      `);

      expect(isStatelessComponent(def)).toBe(false);
    });

    test('does not accept React.Component classes', () => {
      const def = parse(`
        var React = require('react');
        class Foo extends React.Component {
          render() {
            return <div />;
          }
        }
      `).get('body')[1];

      expect(isStatelessComponent(def)).toBe(false);
    });

    test('does not accept React.createClass calls', () => {
      const def = parse.statement(`
        React.createClass({
          render() {
            return <div />;
          }
        });
      `);

      expect(isStatelessComponent(def)).toBe(false);
    });
  });
});
