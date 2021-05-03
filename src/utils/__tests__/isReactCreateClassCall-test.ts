import {
  expressionLast,
  statement,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';
import isReactCreateClassCall from '../isReactCreateClassCall';

describe('isReactCreateClassCall', () => {
  const mockImporter = makeMockImporter({
    foo: statement(`
      export default React.createClass;
      import React from 'react';
    `).get('declaration'),

    bar: statement(`
      export default makeClass;
      import makeClass from "create-react-class";
    `).get('declaration'),
  });

  describe('built in React.createClass', () => {
    it('accepts createClass called on React', () => {
      const def = expressionLast(`
        var React = require("React");
        React.createClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts createClass called on aliased React', () => {
      const def = expressionLast(`
        var other = require("React");
        other.createClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('ignores other React calls', () => {
      const def = expressionLast(`
        var React = require("React");
        React.isValidElement({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(false);
    });

    it('ignores non React calls to createClass', () => {
      const def = expressionLast(`
        var React = require("bob");
        React.createClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(false);
    });

    it('accepts createClass called on destructed value', () => {
      const def = expressionLast(`
        var { createClass } = require("react");
        createClass({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts createClass called on destructed aliased value', () => {
      const def = expressionLast(`
        var { createClass: foo } = require("react");
        foo({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts createClass called on imported value', () => {
      const def = expressionLast(`
        import { createClass } from "react";
        createClass({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts createClass called on imported aliased value', () => {
      const def = expressionLast(`
        import { createClass as foo } from "react";
        foo({});
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('resolves createClass imported from intermediate module', () => {
      const def = expressionLast(`
        import foo from "foo";
        foo({});
      `);
      expect(isReactCreateClassCall(def, mockImporter)).toBe(true);
    });
  });

  describe('modular in create-react-class', () => {
    it('accepts create-react-class', () => {
      const def = expressionLast(`
        var createReactClass = require("create-react-class");
        createReactClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('accepts create-react-class calls on another name', () => {
      const def = expressionLast(`
        var makeClass = require("create-react-class");
        makeClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(true);
    });

    it('ignores non create-react-class calls to createReactClass', () => {
      const def = expressionLast(`
        var createReactClass = require("bob");
        createReactClass({
          render() {}
        });
      `);
      expect(isReactCreateClassCall(def, noopImporter)).toBe(false);
    });

    it('resolves create-react-class imported from intermediate module', () => {
      const def = expressionLast(`
        import bar from "bar";
        bar({});
      `);
      expect(isReactCreateClassCall(def, mockImporter)).toBe(true);
    });
  });
});
