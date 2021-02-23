import {
  expressionLast,
  statement,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';
import isReactCreateElementCall from '../isReactCreateElementCall';

describe('isReactCreateElementCall', () => {
  const mockImporter = makeMockImporter({
    foo: statement(`
      export default React.createElement;
      import React from 'react';
    `).get('declaration'),
  });

  describe('built in React.createElement', () => {
    it('accepts createElement called on React', () => {
      const def = expressionLast(`
        var React = require("React");
        React.createElement({
          render() {}
        });
      `);
      expect(isReactCreateElementCall(def, noopImporter)).toBe(true);
    });

    it('accepts createElement called on aliased React', () => {
      const def = expressionLast(`
        var other = require("React");
        other.createElement({
          render() {}
        });
      `);
      expect(isReactCreateElementCall(def, noopImporter)).toBe(true);
    });

    it('ignores other React calls', () => {
      const def = expressionLast(`
        var React = require("React");
        React.isValidElement({});
      `);
      expect(isReactCreateElementCall(def, noopImporter)).toBe(false);
    });

    it('ignores non React calls to createElement', () => {
      const def = expressionLast(`
        var React = require("bob");
        React.createElement({
          render() {}
        });
      `);
      expect(isReactCreateElementCall(def, noopImporter)).toBe(false);
    });

    it('accepts createElement called on destructed value', () => {
      const def = expressionLast(`
        var { createElement } = require("react");
        createElement({});
      `);
      expect(isReactCreateElementCall(def, noopImporter)).toBe(true);
    });

    it('accepts createElement called on destructed aliased value', () => {
      const def = expressionLast(`
        var { createElement: foo } = require("react");
        foo({});
      `);
      expect(isReactCreateElementCall(def, noopImporter)).toBe(true);
    });

    it('accepts createElement called on imported value', () => {
      const def = expressionLast(`
        import { createElement } from "react";
        createElement({});
      `);
      expect(isReactCreateElementCall(def, noopImporter)).toBe(true);
    });

    it('accepts createElement called on imported aliased value', () => {
      const def = expressionLast(`
        import { createElement as foo } from "react";
        foo({});
      `);
      expect(isReactCreateElementCall(def, noopImporter)).toBe(true);
    });

    it('can resolve createElement imported from an intermediate module', () => {
      const def = expressionLast(`
        import foo from "foo";
        foo({});
      `);
      expect(isReactCreateElementCall(def, mockImporter)).toBe(true);
    });
  });
});
