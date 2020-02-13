/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('../../Documentation');

import { expression, statement } from '../../../tests/utils';

describe('defaultPropsHandler', () => {
  let documentation;
  let displayNameHandler;

  beforeEach(() => {
    documentation = new (require('../../Documentation'))();
    displayNameHandler = require('../displayNameHandler').default;
  });

  it('extracts the displayName', () => {
    let definition = expression('({displayName: "FooBar"})');
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
    let definition = statement(`
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
    let definition = expression('({displayName: foo.bar})');
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

  describe('ClassDeclaration', () => {
    it('considers the class name', () => {
      const definition = statement(`
        class Foo {
        }
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName class property', () => {
      const definition = statement(`
        class Foo {
          static displayName = 'foo';
        }
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('foo');
    });

    it('considers static displayName getter', () => {
      const definition = statement(`
        class Foo {
          static get displayName() {
            return 'foo';
          }
        }
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('foo');
    });

    it('resolves variables in displayName getter', () => {
      const definition = statement(`
        class Foo {
          static get displayName() {
            return abc;
          }
        }
        const abc = 'bar';
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('bar');
    });
  });

  describe('FunctionDeclaration', () => {
    it('considers the function name', () => {
      const definition = statement('function Foo () {}');
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName object property', () => {
      const definition = statement(`
        function Foo () {}
        Foo.displayName = 'Bar';
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });
  });

  describe('FunctionExpression', () => {
    it('considers the variable name', () => {
      const definition = statement('var Foo = function () {};').get(
        'declarations',
        0,
        'init',
      );
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign', () => {
      const definition = statement('Foo = function () {};').get(
        'expression',
        'right',
      );
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName object property over variable name', () => {
      const definition = statement(`
        var Foo = function () {};
        Foo.displayName = 'Bar';
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });
  });

  describe('ArrowFunctionExpression', () => {
    it('considers the variable name', () => {
      const definition = statement('var Foo = () => {};').get(
        'declarations',
        0,
        'init',
      );
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name even if wrapped', () => {
      const definition = statement('var Foo = React.forwardRef(() => {});').get(
        'declarations',
        0,
        'init',
        'arguments',
        0,
      );
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name when handling forwardRef', () => {
      const definition = statement(
        [
          'var Foo = React.forwardRef(() => {});',
          'import React from "react";',
        ].join('\n'),
      ).get('declarations', 0, 'init');
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign', () => {
      const definition = statement('Foo = () => {};').get(
        'expression',
        'right',
      );
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign even if wrapped', () => {
      const definition = statement('Foo = React.forwardRef(() => {});').get(
        'expression',
        'right',
        'arguments',
        0,
      );
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign when handling forwardRef call', () => {
      const definition = statement(
        [
          'Foo = React.forwardRef(() => {});',
          'import React from "react";',
        ].join('\n'),
      ).get('expression', 'right');
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName object property over variable name', () => {
      const definition = statement(`
        var Foo = () => {};
        Foo.displayName = 'Bar';
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('considers a static displayName object property over variable name even if wrapped', () => {
      const definition = statement(`
        var Foo = React.forwardRef(() => {});
        Foo.displayName = 'Bar';
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('ignores assignment to non-literal/identifier', () => {
      const definition = statement('Foo.Bar = () => {};').get(
        'expression',
        'right',
      );
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).not.toBeDefined();
    });
  });
});
