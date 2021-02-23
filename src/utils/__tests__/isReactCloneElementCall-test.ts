import {
  statement,
  noopImporter,
  makeMockImporter,
  expressionLast,
} from '../../../tests/utils';
import isReactCloneElementCall from '../isReactCloneElementCall';

describe('isReactCloneElementCall', () => {
  const mockImporter = makeMockImporter({
    foo: statement(`
      export default React.cloneElement;
      import React from 'react';
    `).get('declaration'),
  });

  describe('built in React.createClass', () => {
    it('accepts cloneElement called on React', () => {
      const def = expressionLast(`
        var React = require("React");
        React.cloneElement({});
      `);
      expect(isReactCloneElementCall(def, noopImporter)).toBe(true);
    });

    it('accepts cloneElement called on aliased React', () => {
      const def = expressionLast(`
        var other = require("React");
        other.cloneElement({});
      `);
      expect(isReactCloneElementCall(def, noopImporter)).toBe(true);
    });

    it('ignores other React calls', () => {
      const def = expressionLast(`
        var React = require("React");
        React.isValidElement({});
      `);
      expect(isReactCloneElementCall(def, noopImporter)).toBe(false);
    });

    it('ignores non React calls to cloneElement', () => {
      const def = expressionLast(`
        var React = require("bob");
        React.cloneElement({});
      `);
      expect(isReactCloneElementCall(def, noopImporter)).toBe(false);
    });

    it('accepts cloneElement called on destructed value', () => {
      const def = expressionLast(`
        var { cloneElement } = require("react");
        cloneElement({});
      `);
      expect(isReactCloneElementCall(def, noopImporter)).toBe(true);
    });

    it('accepts cloneElement called on destructed aliased value', () => {
      const def = expressionLast(`
        var { cloneElement: foo } = require("react");
        foo({});
      `);
      expect(isReactCloneElementCall(def, noopImporter)).toBe(true);
    });

    it('accepts cloneElement called on imported value', () => {
      const def = expressionLast(`
        import { cloneElement } from "react";
        cloneElement({});
      `);
      expect(isReactCloneElementCall(def, noopImporter)).toBe(true);
    });

    it('accepts cloneElement called on imported aliased value', () => {
      const def = expressionLast(`
        import { cloneElement as foo } from "react";
        foo({});
      `);
      expect(isReactCloneElementCall(def, noopImporter)).toBe(true);
    });

    it('can resolve cloneElement imported from an intermediate module', () => {
      const def = expressionLast(`
        import foo from "foo";
        foo({});
      `);
      expect(isReactCloneElementCall(def, mockImporter)).toBe(true);
    });
  });
});
