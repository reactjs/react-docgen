import { parse } from '../../../tests/utils';
import isReactChildrenElementCall from '../isReactChildrenElementCall.js';
import { describe, expect, test } from 'vitest';

describe('isReactChildrenElementCall', () => {
  describe('true', () => {
    test('React.Children.map', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.Children.map(() => {});
      `);

      expect(isReactChildrenElementCall(def)).toBe(true);
    });

    test('React.Children.only', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.Children.only(() => {});
      `);

      expect(isReactChildrenElementCall(def)).toBe(true);
    });
  });
  describe('false', () => {
    test('not call expression', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.Children.map;
      `);

      expect(isReactChildrenElementCall(def)).toBe(false);
    });

    test('not MemberExpression', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        map();
      `);

      expect(isReactChildrenElementCall(def)).toBe(false);
    });

    test('not only or map', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.Children.abc(() => {});
      `);

      expect(isReactChildrenElementCall(def)).toBe(false);
    });

    test('not double MemberExpression', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        Children.map(() => {});
      `);

      expect(isReactChildrenElementCall(def)).toBe(false);
    });

    test('not Children', () => {
      const def = parse.expressionLast(`
        var React = require("React");
        React.Parent.map(() => {});
      `);

      expect(isReactChildrenElementCall(def)).toBe(false);
    });

    test('not react module', () => {
      const def = parse.expressionLast(`
        var React = require("test");
        React.Children.map(() => {});
      `);

      expect(isReactChildrenElementCall(def)).toBe(false);
    });
  });
});
