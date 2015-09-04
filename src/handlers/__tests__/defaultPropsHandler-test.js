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
jest.mock('../../Documentation');

describe('defaultPropsHandler', () => {
  var documentation;
  var defaultPropsHandler;
  var parse;

  beforeEach(() => {
    ({parse} = require('../../../tests/utils'));
    documentation = new (require('../../Documentation'));
    defaultPropsHandler = require('../defaultPropsHandler');
  });

  function test(definition) {
    defaultPropsHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      foo: {
        defaultValue: {
          value: '"bar"',
          computed: false,
        },
      },
      bar: {
        defaultValue: {
          value: '42',
          computed: false,
        },
      },
      baz: {
        defaultValue: {
          value: '["foo", "bar"]',
          computed: false,
        },
      },
      abc: {
        defaultValue: {
          value: '{xyz: abc.def, 123: 42}',
          computed: false,
        },
      },
    });
  }

  describe('ObjectExpression', () => {
    it('should find prop default values that are literals', () => {
      var src = `
        ({
          getDefaultProps: function() {
            return {
              foo: "bar",
              bar: 42,
              baz: ["foo", "bar"],
              abc: {xyz: abc.def, 123: 42}
            };
          }
        })
      `;
      test(parse(src).get('body', 0, 'expression'));
    });
  });

  describe('ClassDeclaration with static defaultProps', () => {
    it('should find prop default values that are literals', () => {
      var src = `
        class Foo {
          static defaultProps = {
            foo: "bar",
            bar: 42,
            baz: ["foo", "bar"],
            abc: {xyz: abc.def, 123: 42}
          };
        }
      `;
      test(parse(src).get('body', 0));
    });
  });

  describe('ClassExpression with static defaultProps', () => {
    it('should find prop default values that are literals', () => {
      var src = `
        var Bar = class {
          static defaultProps = {
            foo: "bar",
            bar: 42,
            baz: ["foo", "bar"],
            abc: {xyz: abc.def, 123: 42}
          };
      }`;
      test(parse(src).get('body', 0, 'declarations', 0, 'init'));
    });
  });

  it('should only consider Property nodes, not e.g. spread properties', () => {
    var src = `
      ({
        getDefaultProps: function() {
          return {
            ...Foo.bar,
            bar: 42,
          };
        }
      })
    `;
    let definition = parse(src).get('body', 0, 'expression');
    expect(() => defaultPropsHandler(documentation, definition))
      .not.toThrow();
    expect(documentation.descriptors).toEqual({
      bar: {
        defaultValue: {
          value: '42',
          computed: false,
        },
      },
    });
  });

});
