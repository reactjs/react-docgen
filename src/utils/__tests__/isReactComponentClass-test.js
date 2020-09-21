/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  expression,
  statement,
  parse,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';
import isReactComponentClass from '../isReactComponentClass';

describe('isReactComponentClass', () => {
  const mockImporter = makeMockImporter({
    component: statement(`
      export default React.Component;
      import React from 'react';
    `).get('declaration'),

    pureComponent: statement(`
      export default React.PureComponent;
      import React from 'react';
    `).get('declaration'),
  });

  describe('render method', () => {
    it('ignores class declarations with a render method without superclass', () => {
      const def = statement('class Foo { render() {}}');
      expect(isReactComponentClass(def, noopImporter)).toBe(false);
    });

    it('ignores class expression with a render method without superclass', () => {
      const def = expression('class { render() {}}');
      expect(isReactComponentClass(def, noopImporter)).toBe(false);
    });

    it('ignores static render methods', () => {
      const def = statement('class Foo { static render() {}}');
      expect(isReactComponentClass(def, noopImporter)).toBe(false);
    });

    it('ignores dynamic render methods', () => {
      const def = statement('class Foo { static [render]() {}}');
      expect(isReactComponentClass(def, noopImporter)).toBe(false);
    });

    it('ignores getter or setter render methods', () => {
      let def = statement('class Foo { get render() {}}');
      expect(isReactComponentClass(def, noopImporter)).toBe(false);

      def = statement('class Foo { set render(value) {}}');
      expect(isReactComponentClass(def, noopImporter)).toBe(false);
    });
  });

  describe('JSDoc @extends React.Component', () => {
    it('accepts class declarations declaring `@extends React.Component` in JSDoc', () => {
      const def = parse(`
        var React = require('react');
        /**
         * @class Foo
         * @extends React.Component
         */
        class Foo extends Bar {}
      `).get('body', 1);

      expect(isReactComponentClass(def, noopImporter)).toBe(true);
    });
  });

  describe('React.Component inheritance', () => {
    it('accepts class declarations extending React.Component', () => {
      const def = parse(`
        var React = require('react');
        class Foo extends React.Component {}
      `).get('body', 1);

      expect(isReactComponentClass(def, noopImporter)).toBe(true);
    });

    it('accepts class expressions extending React.Component', () => {
      const def = parse(`
        var React = require('react');
        var Foo = class extends React.Component {}
      `).get('body', 1, 'declarations', 0, 'init');

      expect(isReactComponentClass(def, noopImporter)).toBe(true);
    });

    it('resolves the super class reference', () => {
      const def = parse(`
        var {Component} = require('react');
        var C = Component;
        class Foo extends C {}
      `).get('body', 2);

      expect(isReactComponentClass(def, noopImporter)).toBe(true);
    });

    it('does not accept references to other modules', () => {
      const def = parse(`
        var {Component} = require('FakeReact');
        class Foo extends Component {}
      `).get('body', 1);

      expect(isReactComponentClass(def, noopImporter)).toBe(false);
    });

    it('does not consider super class if render method is present', () => {
      const def = parse(`
        var {Component} = require('FakeReact');
        class Foo extends Component { render() {} }
      `).get('body', 1);

      expect(isReactComponentClass(def, noopImporter)).toBe(true);
    });

    it('can resolve Component from an intermediate module', () => {
      const def = parse(`
        import RC from 'component';
        class Foo extends RC {}
      `).get('body', 1);

      expect(isReactComponentClass(def, mockImporter)).toBe(true);
    });
  });

  describe('React.PureComponent inheritance', () => {
    it('accepts class declarations extending React.PureComponent', () => {
      const def = parse(`
        var React = require('react');
        class Foo extends React.PureComponent {}
      `).get('body', 1);

      expect(isReactComponentClass(def, noopImporter)).toBe(true);
    });

    it('accepts class expressions extending React.PureComponent', () => {
      const def = parse(`
        var React = require('react');
        var Foo = class extends React.PureComponent {}
      `).get('body', 1, 'declarations', 0, 'init');

      expect(isReactComponentClass(def, noopImporter)).toBe(true);
    });

    it('resolves the super class reference', () => {
      const def = parse(`
        var {PureComponent} = require('react');
        var C = PureComponent;
        class Foo extends C {}
      `).get('body', 2);

      expect(isReactComponentClass(def, noopImporter)).toBe(true);
    });

    it('does not accept references to other modules', () => {
      const def = parse(`
        var {PureComponent} = require('FakeReact');
        class Foo extends PureComponent {}
      `).get('body', 1);

      expect(isReactComponentClass(def, noopImporter)).toBe(false);
    });

    it('does not consider super class if render method is present', () => {
      const def = parse(`
        var {PureComponent} = require('FakeReact');
        class Foo extends PureComponent { render() {} }
      `).get('body', 1);

      expect(isReactComponentClass(def, noopImporter)).toBe(true);
    });

    it('can resolve PureComponent from an intermediate module', () => {
      const def = parse(`
        import PC from 'pureComponent';
        class Foo extends PC {}
      `).get('body', 1);

      expect(isReactComponentClass(def, mockImporter)).toBe(true);
    });
  });
});
