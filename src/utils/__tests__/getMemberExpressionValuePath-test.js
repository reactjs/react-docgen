/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('getMemberExpressionValuePath', () => {
  var getMemberExpressionValuePath;
  var statement;

  beforeEach(() => {
    getMemberExpressionValuePath = require('../getMemberExpressionValuePath')
      .default;
    ({ statement } = require('../../../tests/utils'));
  });

  describe('MethodExpression', () => {
    it('finds "normal" property definitions', () => {
      var def = statement(`
        var Foo = () => {};
        Foo.propTypes = {};
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parent.get('body', 1, 'expression', 'right'),
      );
    });

    it('takes the correct property definitions', () => {
      var def = statement(`
        var Foo = () => {};
        Foo.propTypes = {};
        Bar.propTypes = { unrelated: true };
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parent.get('body', 1, 'expression', 'right'),
      );
    });

    it('finds computed property definitions with literal keys', () => {
      var def = statement(`
        function Foo () {}
        Foo['render'] = () => {};
      `);

      expect(getMemberExpressionValuePath(def, 'render')).toBe(
        def.parent.get('body', 1, 'expression', 'right'),
      );
    });

    it('ignores computed property definitions with expression', () => {
      var def = statement(`
        var Foo = function Bar() {};
        Foo[imComputed] = () => {};
      `);

      expect(getMemberExpressionValuePath(def, 'imComputed')).not.toBeDefined();
    });
  });
  describe('TaggedTemplateLiteral', () => {
    it('finds "normal" property definitions', () => {
      var def = statement(`
        var Foo = foo\`bar\`
        Foo.propTypes = {};
      `);

      expect(getMemberExpressionValuePath(def, 'propTypes')).toBe(
        def.parent.get('body', 1, 'expression', 'right'),
      );
    });
  });
});
