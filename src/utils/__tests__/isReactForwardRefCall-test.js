/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parse, noopImporter } from '../../../tests/utils';
import isReactForwardRefCall from '../isReactForwardRefCall';

describe('isReactForwardRefCall', () => {
  function parsePath(src) {
    const root = parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  describe('built in React.forwardRef', () => {
    it('accepts forwardRef called on React', () => {
      const def = parsePath(`
        var React = require("React");
        React.forwardRef({
          render() {}
        });
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('accepts forwardRef called on aliased React', () => {
      const def = parsePath(`
        var other = require("React");
        other.forwardRef({
          render() {}
        });
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('ignores other React calls', () => {
      const def = parsePath(`
        var React = require("React");
        React.isValidElement({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(false);
    });

    it('ignores non React calls to forwardRef', () => {
      const def = parsePath(`
        var React = require("bob");
        React.forwardRef({
          render() {}
        });
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(false);
    });

    it('accepts forwardRef called on destructed value', () => {
      const def = parsePath(`
        var { forwardRef } = require("react");
        forwardRef({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('accepts forwardRef called on destructed aliased value', () => {
      const def = parsePath(`
        var { forwardRef: foo } = require("react");
        foo({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('accepts forwardRef called on imported value', () => {
      const def = parsePath(`
        import { forwardRef } from "react";
        forwardRef({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });

    it('accepts forwardRef called on imported aliased value', () => {
      const def = parsePath(`
        import { forwardRef as foo } from "react";
        foo({});
      `);
      expect(isReactForwardRefCall(def, noopImporter)).toBe(true);
    });
  });
});
