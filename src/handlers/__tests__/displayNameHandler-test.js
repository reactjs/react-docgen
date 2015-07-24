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
  var displayNameHandler;
  var expression, statement;

  beforeEach(() => {
    ({expression, statement} = require('../../../tests/utils'));
    documentation = new (require('../../Documentation'));
    displayNameHandler = require('../displayNameHandler');
  });

  it('extracts the displayName', () => {
    var definition = expression('({displayName: "FooBar"})');
    displayNameHandler(documentation, definition);
    expect(documentation.displayName).toBe('FooBar');

    definition = statement(`
      class Foo {
        static displayName = "BarFoo";
      }
    `);
    displayNameHandler(documentation, definition);
    expect(documentation.displayName).toBe('BarFoo');
  });

  it('resolves identifiers', () => {
    var definition = statement(`
      ({displayName: name})
      var name = 'abc';
    `).get('expression');
    displayNameHandler(documentation, definition);
    expect(documentation.displayName).toBe('abc');

    definition = statement(`
      class Foo {
        static displayName = name;
      }
      var name = 'xyz';
    `);
    displayNameHandler(documentation, definition);
    expect(documentation.displayName).toBe('xyz');
  });

  it('ignores non-literal names', () => {
    var definition = expression('({displayName: foo.bar})');
    expect(() => displayNameHandler(documentation, definition)).not.toThrow();
    expect(documentation.displayName).not.toBeDefined();

    definition = statement(`
      class Foo {
        static displayName = foo.bar;
      }
    `);
    expect(() => displayNameHandler(documentation, definition)).not.toThrow();
    expect(documentation.displayName).not.toBeDefined();
  });

  it('ignores non-literal names', () => {
    var definition = expression('({displayName: foo.bar})');
    expect(() => displayNameHandler(documentation, definition)).not.toThrow();
    expect(documentation.displayName).not.toBeDefined();

    definition = statement(`
      class Foo {
        static displayName = foo.bar;
      }
    `);
    expect(() => displayNameHandler(documentation, definition)).not.toThrow();
    expect(documentation.displayName).not.toBeDefined();
  });
});
