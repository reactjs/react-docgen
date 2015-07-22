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

jest.autoMockOff();

describe('getClassMemberValuePath', () => {
  var getClassMemberValuePath;
  var statement;

  beforeEach(() => {
    getClassMemberValuePath = require('../getClassMemberValuePath');
    ({statement} = require('../../../tests/utils'));
  });

  describe('MethodDefinitions', () => {
    it('finds "normal" method definitions', () => {
      var def = statement(`
        class Foo {
          render() {}
        }
      `);

      expect(getClassMemberValuePath(def, 'render'))
        .toBe(def.get('body', 'body', 0, 'value'));
    });

    it('finds computed method definitions with literal keys', () => {
      var def = statement(`
        class Foo {
          ['render']() {}
        }
      `);

      expect(getClassMemberValuePath(def, 'render'))
        .toBe(def.get('body', 'body', 0, 'value'));
    });

    it('ignores computed method definitions with expression', () => {
      var def = statement(`
        class Foo {
          [render]() {}
        }
      `);

      expect(getClassMemberValuePath(def, 'render')).not.toBeDefined();
    });
  });

  xdescribe('ClassProperty', () => {
    it('finds "normal" class properties', () => {
      var def = statement(`
        class Foo {
          foo = 42;
        }
      `);

      expect(getClassMemberValuePath(def, 'foo'))
        .toBe(def.get('body', 'body', 0, 'value'));
    });
  });
});
