import { parse, makeMockImporter } from '../../../tests/utils';
import resolveToModule from '../resolveToModule';

describe('resolveToModule', () => {
  const mockImporter = makeMockImporter({
    Foo: stmtLast =>
      stmtLast(`
        import bar from 'Bar';
        export default bar;
      `).get('declaration'),

    Bar: stmtLast =>
      stmtLast(`
        import baz from 'Baz';
        export default baz;
      `).get('declaration'),
  });

  it('resolves identifiers', () => {
    const path = parse.expressionLast(`
      var foo = require("Foo");
      foo;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves function calls', () => {
    const path = parse.expressionLast(`
      var foo = require("Foo");
      foo();
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves member expressions', () => {
    const path = parse.expressionLast(`
      var foo = require("Foo");
      foo.bar().baz;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('understands destructuring', () => {
    const path = parse.expressionLast(`
      var {foo} = require("Foo");
      foo;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  describe('ES6 import declarations', () => {
    it('resolves ImportDefaultSpecifier', () => {
      let path = parse.expressionLast(`
        import foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');

      path = parse.expressionLast(`
        import foo, {createElement} from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves ImportSpecifier', () => {
      const path = parse.expressionLast(`
        import {foo, bar} from "Foo";
        bar;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves aliased ImportSpecifier', () => {
      const path = parse.expressionLast(`
        import {foo, bar as baz} from "Foo";
        baz;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves ImportNamespaceSpecifier', () => {
      const path = parse.expressionLast(`
        import * as foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('can resolve imports until one not expanded', () => {
      const path = parse.expressionLast(
        `
        import foo from "Foo";
        foo;
      `,
        mockImporter,
      );
      expect(resolveToModule(path)).toBe('Baz');
    });
  });
});
