import { parse, makeMockImporter } from '../../../tests/utils';
import isReactComponentClass from '../isReactComponentClass.js';
import { describe, expect, test } from 'vitest';

describe('isReactComponentClass', () => {
  const mockImporter = makeMockImporter({
    component: (stmtLast) =>
      stmtLast(`
      import React from 'react';
      export default React.Component;
    `).get('declaration'),

    pureComponent: (stmtLast) =>
      stmtLast(`
      import React from 'react';
      export default React.PureComponent;
    `).get('declaration'),
  });

  describe('render method', () => {
    test('ignores class declarations with a render method without superclass', () => {
      const def = parse.statement('class Foo { render() {}}');

      expect(isReactComponentClass(def)).toBe(false);
    });

    test('ignores class expression with a render method without superclass', () => {
      const def = parse.expression('class { render() {}}');

      expect(isReactComponentClass(def)).toBe(false);
    });

    test('ignores static render methods', () => {
      const def = parse.statement('class Foo extends X { static render() {}}');

      expect(isReactComponentClass(def)).toBe(false);
    });

    test('ignores dynamic render methods', () => {
      const def = parse.statement(
        'class Foo extends X { static [render]() {}}',
      );

      expect(isReactComponentClass(def)).toBe(false);
    });

    test('ignores getter or setter render methods', () => {
      let def = parse.statement('class Foo extends X { get render() {}}');

      expect(isReactComponentClass(def)).toBe(false);

      def = parse.statement('class Foo extends X { set render(value) {}}');
      expect(isReactComponentClass(def)).toBe(false);
    });
  });

  describe('React.Component inheritance', () => {
    test('accepts class declarations extending React.Component', () => {
      const def = parse.statementLast(`
        var React = require('react');
        class Foo extends React.Component {}
      `);

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('accepts class expressions extending React.Component', () => {
      const def = parse
        .statementLast(
          `
        var React = require('react');
        var Foo = class extends React.Component {}
      `,
        )
        .get('declarations')[0]
        .get('init');

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('resolves the super class reference', () => {
      const def = parse.statementLast(`
        var { Component } = require('react');
        var C = Component;
        class Foo extends C {}
      `);

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('resolves the super class reference with named import', () => {
      const def = parse.statementLast(`
        import { Component } from 'react';
        class Foo extends Component {}
      `);

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('resolves the super class reference with default import', () => {
      const def = parse.statementLast(`
        import React from 'react';
        class Foo extends React.Component {}
      `);

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('resolves the super class reference with namespace import', () => {
      const def = parse.statementLast(`
        import * as React from 'react';
        class Foo extends React.Component {}
      `);

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('resolves the super class reference with alias', () => {
      const def = parse.statementLast(`
        var { Component: C } = require('react');
        class Foo extends C {}
      `);

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('does not accept references to other modules', () => {
      const def = parse.statementLast(
        `
        var { Component } = require('FakeReact');
        class Foo extends Component {}
      `,
      );

      expect(isReactComponentClass(def)).toBe(false);
    });

    test('does not consider super class if render method is present', () => {
      const def = parse.statementLast(
        `
        var {Component} = require('FakeReact');
        class Foo extends Component { render() {} }
      `,
      );

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('can resolve Component from an intermediate module', () => {
      const def = parse.statementLast(
        `import RC from 'component';
         class Foo extends RC {}`,
        mockImporter,
      );

      expect(isReactComponentClass(def)).toBe(true);
    });
  });

  describe('React.PureComponent inheritance', () => {
    test('accepts class declarations extending React.PureComponent', () => {
      const def = parse.statementLast(
        `var React = require('react');
           class Foo extends React.PureComponent {}`,
      );

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('accepts class expressions extending React.PureComponent', () => {
      const def = parse
        .statementLast(
          `var React = require('react');
           var Foo = class extends React.PureComponent {}`,
        )
        .get('declarations')[0]
        .get('init');

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('resolves the super class reference', () => {
      const def = parse.statementLast(
        `var {PureComponent} = require('react');
         var C = PureComponent;
         class Foo extends C {}`,
      );

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('does not accept references to other modules', () => {
      const def = parse.statementLast(
        `var {PureComponent} = require('FakeReact');
        class Foo extends PureComponent {}`,
      );

      expect(isReactComponentClass(def)).toBe(false);
    });

    test('does not consider super class if render method is present', () => {
      const def = parse.statementLast(`
        var {PureComponent} = require('FakeReact');
        class Foo extends PureComponent { render() {} }
      `);

      expect(isReactComponentClass(def)).toBe(true);
    });

    test('can resolve PureComponent from an intermediate module', () => {
      const def = parse.statementLast(
        `
        import PC from 'pureComponent';
        class Foo extends PC {}
      `,
        mockImporter,
      );

      expect(isReactComponentClass(def)).toBe(true);
    });
  });
});
