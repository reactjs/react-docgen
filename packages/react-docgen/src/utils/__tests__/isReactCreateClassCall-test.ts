import { parse, makeMockImporter } from '../../../tests/utils';
import isReactCreateClassCall from '../isReactCreateClassCall';

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
    it('accepts createClass called on React', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.createClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    it('accepts createClass called on aliased React', () => {
      const def = parse.expressionLast(`
        var other = require("React");
        other.createClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    it('ignores other React calls', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.isValidElement({});
      `);

      expect(isReactCreateClassCall(def)).toBe(false);
    });

    it('ignores non React calls to createClass', () => {
      const def = parse.expressionLast(`
        var React = require("bob");
        React.createClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(false);
    });

    it('accepts createClass called on destructed value', () => {
      const def = parse.expressionLast(`
        var { createClass } = require("react");
        createClass({});
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    it('accepts createClass called on destructed aliased value', () => {
      const def = parse.expressionLast(`
        var { createClass: foo } = require("react");
        foo({});
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    it('accepts createClass called on imported value', () => {
      const def = parse.expressionLast(`
        import { createClass } from "react";
        createClass({});
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    it('accepts createClass called on imported aliased value', () => {
      const def = parse.expressionLast(`
        import { createClass as foo } from "react";
        foo({});
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    it('resolves createClass imported from intermediate module', () => {
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
    it('accepts create-react-class', () => {
      const def = parse.expressionLast(`
        var createReactClass = require("create-react-class");
        createReactClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    it('accepts create-react-class calls on another name', () => {
      const def = parse.expressionLast(`
        var makeClass = require("create-react-class");
        makeClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(true);
    });

    it('ignores non create-react-class calls to createReactClass', () => {
      const def = parse.expressionLast(`
        var createReactClass = require("bob");
        createReactClass({
          render() {}
        });
      `);

      expect(isReactCreateClassCall(def)).toBe(false);
    });

    it('resolves create-react-class imported from intermediate module', () => {
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
