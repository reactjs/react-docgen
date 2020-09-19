/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parse, noopImporter } from '../../../tests/utils';
import isReactCreateClassCall from '../isReactCreateClassCall';

describe('isReactCreateClassCall', () => {
  function parsePath(src) {
    const root = parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  describe('built in React.createClass', () => {
    it('accepts createClass called on React', () => {
      const def = parsePath(`
        var React = require("React");
        React.createClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts createClass called on aliased React', () => {
      const def = parsePath(`
        var other = require("React");
        other.createClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('ignores other React calls', () => {
      const def = parsePath(`
        var React = require("React");
        React.isValidElement({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(false);
    });

    it('ignores non React calls to createClass', () => {
      const def = parsePath(`
        var React = require("bob");
        React.createClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(false);
    });

    it('accepts createClass called on destructed value', () => {
      const def = parsePath(`
        var { createClass } = require("react");
        createClass({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts createClass called on destructed aliased value', () => {
      const def = parsePath(`
        var { createClass: foo } = require("react");
        foo({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts createClass called on imported value', () => {
      const def = parsePath(`
        import { createClass } from "react";
        createClass({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts createClass called on imported aliased value', () => {
      const def = parsePath(`
        import { createClass as foo } from "react";
        foo({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });
  });

  describe('modular in create-react-class', () => {
    it('accepts create-react-class', () => {
      const def = parsePath(`
        var createReactClass = require("create-react-class");
        createReactClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts create-react-class calls on another name', () => {
      const def = parsePath(`
        var makeClass = require("create-react-class");
        makeClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('ignores non create-react-class calls to createReactClass', () => {
      const def = parsePath(`
        var createReactClass = require("bob");
        createReactClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(false);
    });
  });
});
