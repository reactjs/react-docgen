import {
  statement,
  noopImporter,
  makeMockImporter,
  expressionLast,
} from '../../../tests/utils';
import isReactForwardRefCall from '../isReactForwardRefCall';

describe('isReactForwardRefCall', () => {
  const mockImporter = makeMockImporter({
    foo: statement(`
      export default React.forwardRef;
      import React from 'react';
    `).get('declaration'),
  });

  describe('built in React.forwardRef', () => {
    it('accepts forwardRef called on React', () => {
      const def = expressionLast(`
        var React = require("React");
        React.forwardRef({
          render() {}
        });
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('accepts forwardRef called on aliased React', () => {
      const def = expressionLast(`
        var other = require("React");
        other.forwardRef({
          render() {}
        });
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('ignores other React calls', () => {
      const def = expressionLast(`
        var React = require("React");
        React.isValidElement({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(false);
    });

    it('ignores non React calls to forwardRef', () => {
      const def = expressionLast(`
        var React = require("bob");
        React.forwardRef({
          render() {}
        });
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(false);
    });

    it('accepts forwardRef called on destructed value', () => {
      const def = expressionLast(`
        var { forwardRef } = require("react");
        forwardRef({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('accepts forwardRef called on destructed aliased value', () => {
      const def = expressionLast(`
        var { forwardRef: foo } = require("react");
        foo({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('accepts forwardRef called on imported value', () => {
      const def = expressionLast(`
        import { forwardRef } from "react";
        forwardRef({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('does not accept forwardRef if not outer call', () => {
      const def = expressionLast(`
        import { forwardRef, memo } from "react";
        memo(forwardRef({}));
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(false);
    });

    it('accepts forwardRef called on imported aliased value', () => {
      const def = expressionLast(`
        import { forwardRef as foo } from "react";
        foo({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('can resolve forwardRef imported from an intermediate module', () => {
      const def = expressionLast(`
        import foo from "foo";
        foo({});
      `);
      expect(isReactForwardRefCall(def, mockImporter)).toBe(true);
    });
  });
});
