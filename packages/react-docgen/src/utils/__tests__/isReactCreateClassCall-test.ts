import { parse, makeMockImporter } from '../../../tests/utils';
import isReactCreateClassCall from '../isReactCreateClassCall.js';
import { describe, expect, test } from 'vitest';

describe('isReactCreateClassCall', () => {
  const mockImporter = makeMockImporter({
    foo: stmtLast =>
      stmtLast(`
      import React from 'react';
      export default React.createClass;
    `).get('declaration'),

    bar: stmtLast =>
      stmtLast(`
      import makeClass from "create-react-class";
      export default makeClass;
    `).get('declaration'),
  });

  describe('built in React.createClass', () => {
    test('accepts createClass called on React', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.createClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    test('accepts createClass called on aliased React', () => {
      const def = parse.expressionLast(`
        var other = require("React");
        other.createClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    test('ignores other React calls', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.isValidElement({});
      `);

      expect(isReactCreateClassCall(def)).toBe(false);
    });

    test('ignores non React calls to createClass', () => {
      const def = parse.expressionLast(`
        var React = require("bob");
        React.createClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(false);
    });

    test('accepts createClass called on destructed value', () => {
      const def = parse.expressionLast(`
        var { createClass } = require("react");
        createClass({});
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    test('accepts createClass called on destructed aliased value', () => {
      const def = parse.expressionLast(`
        var { createClass: foo } = require("react");
        foo({});
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    test('accepts createClass called on imported value', () => {
      const def = parse.expressionLast(`
        import { createClass } from "react";
        createClass({});
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    test('accepts createClass called on imported aliased value', () => {
      const def = parse.expressionLast(`
        import { createClass as foo } from "react";
        foo({});
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    test('resolves createClass imported from intermediate module', () => {
      const def = parse.expressionLast(
        `
        import foo from "foo";
        foo({});
      `,
        mockImporter,
      );

      expect(isReactCreateClassCall(def)).toBe(true);
    });
  });

  describe('modular in create-react-class', () => {
    test('accepts create-react-class', () => {
      const def = parse.expressionLast(`
        var createReactClass = require("create-react-class");
        createReactClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    test('accepts create-react-class calls on another name', () => {
      const def = parse.expressionLast(`
        var makeClass = require("create-react-class");
        makeClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    test('ignores non create-react-class calls to createReactClass', () => {
      const def = parse.expressionLast(`
        var createReactClass = require("bob");
        createReactClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(false);
    });

    test('resolves create-react-class imported from intermediate module', () => {
      const def = parse.expressionLast(
        `
        import bar from "bar";
        bar({});
      `,
        mockImporter,
      );

      expect(isReactCreateClassCall(def)).toBe(true);
    });
  });
});
