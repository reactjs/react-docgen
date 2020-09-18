/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('../../Documentation');

import {
  expression,
  statement,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';

describe('defaultPropsHandler', () => {
  let documentation;
  let displayNameHandler;

  beforeEach(() => {
    documentation = new (require('../../Documentation'))();
    displayNameHandler = require('../displayNameHandler').default;
  });

  const mockImporter = makeMockImporter({
    foobarbaz: statement(`
      export default "FooBarBaz"
    `).get('declaration'),

    foo: statement(`
      export default {bar: 'baz'};
    `).get('declaration'),

    bar: statement(`
      export default {baz: 'foo'};
    `).get('declaration'),
  });

  it('extracts the displayName', () => {
    let definition = expression('({displayName: "FooBar"})');
    displayNameHandler(documentation, definition, noopImporter);
    expect(documentation.displayName).toBe('FooBar');

    definition = statement(`
      ({displayName: foobarbaz});
      import foobarbaz from 'foobarbaz';
    `).get('expression');
    displayNameHandler(documentation, definition, mockImporter);
    expect(documentation.displayName).toBe('FooBarBaz');

    definition = statement(`
      class Foo {
        static displayName = "BarFoo";
      }
    `);
    displayNameHandler(documentation, definition, noopImporter);
    expect(documentation.displayName).toBe('BarFoo');

    definition = statement(`
      class Foo {
        static displayName = foobarbaz;
      }
      import foobarbaz from 'foobarbaz';
    `);
    displayNameHandler(documentation, definition, mockImporter);
    expect(documentation.displayName).toBe('FooBarBaz');
  });

  it('resolves identifiers', () => {
    let definition = statement(`
      ({displayName: name})
      var name = 'abc';
    `).get('expression');
    displayNameHandler(documentation, definition, noopImporter);
    expect(documentation.displayName).toBe('abc');

    definition = statement(`
      ({displayName: name})
      import foobarbaz from 'foobarbaz';
      var name = foobarbaz;
    `).get('expression');
    displayNameHandler(documentation, definition, mockImporter);
    expect(documentation.displayName).toBe('FooBarBaz');

    definition = statement(`
      class Foo {
        static displayName = name;
      }
      var name = 'xyz';
    `);
    displayNameHandler(documentation, definition, noopImporter);
    expect(documentation.displayName).toBe('xyz');

    definition = statement(`
      class Foo {
        static displayName = name;
      }
      import foobarbaz from 'foobarbaz';
      var name = foobarbaz;
    `);
    displayNameHandler(documentation, definition, mockImporter);
    expect(documentation.displayName).toBe('FooBarBaz');
  });

  it('ignores non-literal names', () => {
    let definition = expression('({displayName: foo.bar})');
    expect(() =>
      displayNameHandler(documentation, definition, noopImporter),
    ).not.toThrow();
    expect(documentation.displayName).not.toBeDefined();

    definition = statement(`
      class Foo {
        static displayName = foo.bar;
      }
    `);
    expect(() =>
      displayNameHandler(documentation, definition, noopImporter),
    ).not.toThrow();
    expect(documentation.displayName).not.toBeDefined();
  });

  it('can resolve non-literal names with appropriate importer', () => {
    let definition = statement(`
      ({displayName: foo.bar});
      import foo from 'foo';
    `).get('expression');
    displayNameHandler(documentation, definition, mockImporter);
    expect(documentation.displayName).toBe('baz');

    definition = statement(`
      class Foo {
        static displayName = bar.baz;
      }
      import bar from 'bar';
    `);
    displayNameHandler(documentation, definition, mockImporter);
    expect(documentation.displayName).toBe('foo');
  });

  describe('ClassDeclaration', () => {
    it('considers the class name', () => {
      const definition = statement(`
        class Foo {
        }
      `);
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName class property', () => {
      const definition = statement(`
        class Foo {
          static displayName = 'foo';
        }
      `);
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
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
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
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
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('bar');
    });

    it('resolves imported variables in displayName getter', () => {
      let definition = statement(`
        class Foo {
          static get displayName() {
            return foobarbaz;
          }
        }
        import foobarbaz from 'foobarbaz';
      `);
      displayNameHandler(documentation, definition, mockImporter);
      expect(documentation.displayName).toBe('FooBarBaz');

      definition = statement(`
        class Foo {
          static get displayName() {
            return foo.bar;
          }
        }
        import foo from 'foo';
      `);
      displayNameHandler(documentation, definition, mockImporter);
      expect(documentation.displayName).toBe('baz');
    });
  });

  describe('FunctionDeclaration', () => {
    it('considers the function name', () => {
      const definition = statement('function Foo () {}');
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName object property', () => {
      const definition = statement(`
        function Foo () {}
        Foo.displayName = 'Bar';
      `);
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves variable assigned to displayName object property', () => {
      const definition = statement(`
        function Foo () {}
        Foo.displayName = bar;
        var bar = 'Bar';
      `);
      displayNameHandler(documentation, definition, noopImporter);
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves imported variable assigned to displayName object property', () => {
      let definition = statement(`
        function Foo () {}
        import foobarbaz from 'foobarbaz';
        Foo.displayName = foobarbaz;
      `);
      displayNameHandler(documentation, definition, mockImporter);
      expect(documentation.displayName).toBe('FooBarBaz');

      definition = statement(`
        function Foo () {}
        import foo from 'foo';
        Foo.displayName = foo.bar;
      `);
      displayNameHandler(documentation, definition, mockImporter);
      expect(documentation.displayName).toBe('baz');
    });
  });

  describe('FunctionExpression', () => {
    it('considers the variable name', () => {
      const definition = statement('var Foo = function () {};').get(
        'declarations',
        0,
        'init',
      );
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign', () => {
      const definition = statement('Foo = function () {};').get(
        'expression',
        'right',
      );
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName object property over variable name', () => {
      const definition = statement(`
        var Foo = function () {};
        Foo.displayName = 'Bar';
      `);
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves variable assigned to displayName object property over variable name', () => {
      const definition = statement(`
        var Foo = function () {};
        Foo.displayName = bar;
        var bar = 'Bar';
      `);
      displayNameHandler(documentation, definition, noopImporter);
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves imported variable assigned to displayName object property over variable name', () => {
      let definition = statement(`
        var Foo = function () {};
        import foobarbaz from 'foobarbaz';
        Foo.displayName = foobarbaz;
      `);
      displayNameHandler(documentation, definition, mockImporter);
      expect(documentation.displayName).toBe('FooBarBaz');

      definition = statement(`
        var Foo = function () {};
        import foo from 'foo';
        Foo.displayName = foo.bar;
      `);
      displayNameHandler(documentation, definition, mockImporter);
      expect(documentation.displayName).toBe('baz');
    });
  });

  describe('ArrowFunctionExpression', () => {
    it('considers the variable name', () => {
      const definition = statement('var Foo = () => {};').get(
        'declarations',
        0,
        'init',
      );
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
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
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name when handling forwardRef', () => {
      const definition = statement(`
        var Foo = React.forwardRef(() => {});
        import React from "react";
      `).get('declarations', 0, 'init');
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign', () => {
      const definition = statement('Foo = () => {};').get(
        'expression',
        'right',
      );
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign even if wrapped', () => {
      const definition = statement('Foo = React.forwardRef(() => {});').get(
        'expression',
        'right',
        'arguments',
        0,
      );
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign when handling forwardRef call', () => {
      const definition = statement(`
        Foo = React.forwardRef(() => {});
        import React from "react";
      `).get('expression', 'right');
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName object property over variable name', () => {
      const definition = statement(`
        var Foo = () => {};
        Foo.displayName = 'Bar';
      `);
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves a variable assigned to displayName object property over variable name', () => {
      const definition = statement(`
        var Foo = () => {};
        Foo.displayName = bar;
        var bar = 'Bar';
      `);
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves imported variable assigned to displayName object property over variable name', () => {
      let definition = statement(`
        var Foo = () => {};
        import foobarbaz from 'foobarbaz';
        Foo.displayName = foobarbaz;
      `);
      expect(() =>
        displayNameHandler(documentation, definition, mockImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('FooBarBaz');

      definition = statement(`
        var Foo = () => {};
        import foo from 'foo';
        Foo.displayName = foo.bar;
      `);
      expect(() =>
        displayNameHandler(documentation, definition, mockImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('baz');
    });

    it('considers a static displayName object property over variable name even if wrapped', () => {
      const definition = statement(`
        var Foo = React.forwardRef(() => {});
        Foo.displayName = 'Bar';
      `);
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves a variable assigned to displayName object property over variable name even if wrapped', () => {
      const definition = statement(`
        var Foo = React.forwardRef(() => {});
        Foo.displayName = bar;
        var bar = 'Bar';
      `);
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves imported variable assigned to displayName object property over variable name even if wrapped', () => {
      let definition = statement(`
        var Foo = React.forwardRef(() => {});
        import foobarbaz from 'foobarbaz';
        Foo.displayName = foobarbaz;
      `);
      expect(() =>
        displayNameHandler(documentation, definition, mockImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('FooBarBaz');

      definition = statement(`
        var Foo = React.forwardRef(() => {});
        import foo from 'foo';
        Foo.displayName = foo.bar;
      `);
      expect(() =>
        displayNameHandler(documentation, definition, mockImporter),
      ).not.toThrow();
      expect(documentation.displayName).toBe('baz');
    });

    it('ignores assignment to non-literal/identifier', () => {
      const definition = statement('Foo.Bar = () => {};').get(
        'expression',
        'right',
      );
      expect(() =>
        displayNameHandler(documentation, definition, noopImporter),
      ).not.toThrow();
      expect(documentation.displayName).not.toBeDefined();
    });
  });
});
