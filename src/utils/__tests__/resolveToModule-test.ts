import {
  statement,
  noopImporter,
  makeMockImporter,
  expressionLast,
} from '../../../tests/utils';
import resolveToModule from '../resolveToModule';

describe('resolveToModule', () => {
  const mockImporter = makeMockImporter({
    Foo: statement(`
      export default bar;
      import bar from 'Bar';
    `).get('declaration'),

    Bar: statement(`
      export default baz;
      import baz from 'Baz';
    `).get('declaration'),
  });

  it('resolves identifiers', () => {
    const path = expressionLast(`
      var foo = require("Foo");
      foo;
    `);
    expect(resolveToModule(path, noopImporter)).toBe('Foo');
  });

  it('resolves function calls', () => {
    const path = expressionLast(`
      var foo = require("Foo");
      foo();
    `);
    expect(resolveToModule(path, noopImporter)).toBe('Foo');
  });

  it('resolves member expressions', () => {
    const path = expressionLast(`
      var foo = require("Foo");
      foo.bar().baz;
    `);
    expect(resolveToModule(path, noopImporter)).toBe('Foo');
  });

  it('understands destructuring', () => {
    const path = expressionLast(`
      var {foo} = require("Foo");
      foo;
    `);
    expect(resolveToModule(path, noopImporter)).toBe('Foo');
  });

  describe('ES6 import declarations', () => {
    it('resolves ImportDefaultSpecifier', () => {
      let path = expressionLast(`
        import foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path, noopImporter)).toBe('Foo');

      path = expressionLast(`
        import foo, {createElement} from "Foo";
        foo;
      `);
      expect(resolveToModule(path, noopImporter)).toBe('Foo');
    });

    it('resolves ImportSpecifier', () => {
      const path = expressionLast(`
        import {foo, bar} from "Foo";
        bar;
      `);
      expect(resolveToModule(path, noopImporter)).toBe('Foo');
    });

    it('resolves aliased ImportSpecifier', () => {
      const path = expressionLast(`
        import {foo, bar as baz} from "Foo";
        baz;
      `);
      expect(resolveToModule(path, noopImporter)).toBe('Foo');
    });

    it('resolves ImportNamespaceSpecifier', () => {
      const path = expressionLast(`
        import * as foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path, noopImporter)).toBe('Foo');
    });

    it('can resolve imports until one not expanded', () => {
      const path = expressionLast(`
        import foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path, mockImporter)).toBe('Baz');
    });
  });
});
