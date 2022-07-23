import { makeMockImporter, parse } from '../../../tests/utils';
import isReactForwardRefCall from '../isReactForwardRefCall';

describe('isReactForwardRefCall', () => {
  const mockImporter = makeMockImporter({
    foo: stmtLast =>
      stmtLast(`
      import React from 'react';
      export default React.forwardRef;
    `).get('declaration'),
  });

  describe('built in React.forwardRef', () => {
    it('accepts forwardRef called on React', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.forwardRef({
          render() {}
        });
      `);
      expect(isReactForwardRefCall(def)).toBe(true);
    });

    it('accepts forwardRef called on aliased React', () => {
      const def = parse.expressionLast(`
        var other = require("React");
        other.forwardRef({
          render() {}
        });
      `);
      expect(isReactForwardRefCall(def)).toBe(true);
    });

    it('ignores other React calls', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.isValidElement({});
      `);
      expect(isReactForwardRefCall(def)).toBe(false);
    });

    it('ignores non React calls to forwardRef', () => {
      const def = parse.expressionLast(`
        var React = require("bob");
        React.forwardRef({
          render() {}
        });
      `);
      expect(isReactForwardRefCall(def)).toBe(false);
    });

    it('accepts forwardRef called on destructed value', () => {
      const def = parse.expressionLast(`
        var { forwardRef } = require("react");
        forwardRef({});
      `);
      expect(isReactForwardRefCall(def)).toBe(true);
    });

    it('accepts forwardRef called on destructed aliased value', () => {
      const def = parse.expressionLast(`
        var { forwardRef: foo } = require("react");
        foo({});
      `);
      expect(isReactForwardRefCall(def)).toBe(true);
    });

    it('accepts forwardRef called on imported value', () => {
      const def = parse.expressionLast(`
        import { forwardRef } from "react";
        forwardRef({});
      `);
      expect(isReactForwardRefCall(def)).toBe(true);
    });

    it('does not accept forwardRef if not outer call', () => {
      const def = parse.expressionLast(`
        import { forwardRef, memo } from "react";
        memo(forwardRef({}));
      `);
      expect(isReactForwardRefCall(def)).toBe(false);
    });

    it('accepts forwardRef called on imported aliased value', () => {
      const def = parse.expressionLast(`
        import { forwardRef as foo } from "react";
        foo({});
      `);
      expect(isReactForwardRefCall(def)).toBe(true);
    });

    it('can resolve forwardRef imported from an intermediate module', () => {
      const def = parse.expressionLast(
        `
        import foo from "foo";
        foo({});
      `,
        mockImporter,
      );
      expect(isReactForwardRefCall(def)).toBe(true);
    });
  });
});
