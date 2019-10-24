/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parse } from '../../../tests/utils';
import isReactCloneElementCall from '../isReactCloneElementCall';

describe('isReactCloneElementCall', () => {
  function parsePath(src) {
    const root = parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  describe('built in React.createClass', () => {
    it('accepts cloneElement called on React', () => {
      const def = parsePath(`
        var React = require("React");
        React.cloneElement({});
      `);
      expect(isReactCloneElementCall(def)).toBe(true);
    });

    it('accepts cloneElement called on aliased React', () => {
      const def = parsePath(`
        var other = require("React");
        other.cloneElement({});
      `);
      expect(isReactCloneElementCall(def)).toBe(true);
    });

    it('ignores other React calls', () => {
      const def = parsePath(`
        var React = require("React");
        React.isValidElement({});
      `);
      expect(isReactCloneElementCall(def)).toBe(false);
    });

    it('ignores non React calls to cloneElement', () => {
      const def = parsePath(`
        var React = require("bob");
        React.cloneElement({});
      `);
      expect(isReactCloneElementCall(def)).toBe(false);
    });

    it('accepts cloneElement called on destructed value', () => {
      const def = parsePath(`
        var { cloneElement } = require("react");
        cloneElement({});
      `);
      expect(isReactCloneElementCall(def)).toBe(true);
    });

    it('accepts cloneElement called on destructed aliased value', () => {
      const def = parsePath(`
        var { cloneElement: foo } = require("react");
        foo({});
      `);
      expect(isReactCloneElementCall(def)).toBe(true);
    });

    it('accepts cloneElement called on imported value', () => {
      const def = parsePath(`
        import { cloneElement } from "react";
        cloneElement({});
      `);
      expect(isReactCloneElementCall(def)).toBe(true);
    });

    it('accepts cloneElement called on imported aliased value', () => {
      const def = parsePath(`
        import { cloneElement as foo } from "react";
        foo({});
      `);
      expect(isReactCloneElementCall(def)).toBe(true);
    });
  });
});
