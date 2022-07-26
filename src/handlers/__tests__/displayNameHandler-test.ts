import { parse, makeMockImporter } from '../../../tests/utils';
import Documentation from '../../Documentation';
import displayNameHandler from '../displayNameHandler';
import type DocumentationMock from '../../__mocks__/Documentation';
import type {
  ArrowFunctionExpression,
  ClassDeclaration,
  ExportDefaultDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  ObjectExpression,
  VariableDeclaration,
} from '@babel/types';
import type { NodePath } from '@babel/traverse';

jest.mock('../../Documentation');

describe('defaultPropsHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    foobarbaz: stmt =>
      stmt(`
      export default "FooBarBaz"
    `).get('declaration'),

    foo: stmt =>
      stmt(`
      export default {bar: 'baz'};
    `).get('declaration'),

    bar: stmt =>
      stmt(`
      export default {baz: 'foo'};
    `).get('declaration'),
  });

  it('extracts the displayName', () => {
    const definition = parse.expression<ObjectExpression>(
      '{displayName: "FooBar"}',
    );
    displayNameHandler(documentation, definition);
    expect(documentation.displayName).toBe('FooBar');
  });

  it('extracts the imported displayName', () => {
    const definition = parse.expressionLast<ObjectExpression>(
      `import foobarbaz from 'foobarbaz';
       ({displayName: foobarbaz});`,
      mockImporter,
    );
    displayNameHandler(documentation, definition);
    expect(documentation.displayName).toBe('FooBarBaz');
  });

  it('resolves identifiers', () => {
    const definition = parse.expressionLast<ObjectExpression>(
      `var name = 'abc';
       ({displayName: name})`,
    );
    displayNameHandler(documentation, definition);
    expect(documentation.displayName).toBe('abc');
  });

  it('resolves imported identifiers', () => {
    const definition = parse.expressionLast<ObjectExpression>(
      `import foobarbaz from 'foobarbaz';
       var name = foobarbaz;
       ({displayName: name})`,
      mockImporter,
    );
    displayNameHandler(documentation, definition);
    expect(documentation.displayName).toBe('FooBarBaz');
  });

  it('can resolve non-literal names with appropriate importer', () => {
    const definition = parse.expressionLast<ObjectExpression>(
      `import foo from 'foo';
       ({displayName: foo.bar});`,
      mockImporter,
    );
    displayNameHandler(documentation, definition);
    expect(documentation.displayName).toBe('baz');
  });

  it('ignores non-literal names', () => {
    const definition = parse.expression<ObjectExpression>(
      '{displayName: foo.bar}',
    );
    expect(() => displayNameHandler(documentation, definition)).not.toThrow();
    expect(documentation.displayName).not.toBeDefined();
  });

  describe('ClassDeclaration', () => {
    it('considers the class name', () => {
      const definition = parse.statement<ClassDeclaration>(`class Foo {}`);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('does not crash if no name', () => {
      const definition = parse
        .statement<ExportDefaultDeclaration>(`export default class {}`)
        .get('declaration') as NodePath<ClassDeclaration>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBeUndefined();
    });

    it('resolves identifiers', () => {
      const definition = parse.statement<ClassDeclaration>(`
      class Foo {
        static displayName = name;
      }
      var name = 'xyz';
    `);
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('xyz');
    });

    it('resolves imported identifiers', () => {
      const definition = parse.statement<ClassDeclaration>(
        `
      class Foo {
        static displayName = name;
      }
      import foobarbaz from 'foobarbaz';
      var name = foobarbaz;
    `,
        mockImporter,
      );
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('FooBarBaz');
    });

    it('resolves imported displayName', () => {
      const definition = parse.statement<ClassDeclaration>(
        `
      class Foo {
        static displayName = foobarbaz;
      }
      import foobarbaz from 'foobarbaz';
    `,
        mockImporter,
      );
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('FooBarBaz');
    });

    it('ignores non-literal names', () => {
      const definition = parse.statement<ClassDeclaration>(`
      class Foo {
        static displayName = foo.bar;
      }
    `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBeUndefined();
    });

    it('can resolve non-literal names with appropriate importer', () => {
      const definition = parse.statement<ClassDeclaration>(
        `
      class Foo {
        static displayName = bar.baz;
      }
      import bar from 'bar';
    `,
        mockImporter,
      );
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('foo');
    });

    it('considers a static displayName class property', () => {
      const definition = parse.statement<ClassDeclaration>(`
        class Foo {
          static displayName = 'foo';
        }
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('foo');
    });

    it('considers static displayName getter', () => {
      const definition = parse.statement<ClassDeclaration>(`
        class Foo {
          static get displayName() {
            return 'foo';
          }
        }
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('foo');
    });

    it('considers static displayName property with function expression', () => {
      const definition = parse.statement<ClassDeclaration>(`
        class Foo {
          static displayName = function() {
            return 'foo';
          }
        }
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('foo');
    });

    it('considers static displayName property with function declaration', () => {
      const definition = parse.statement<ClassDeclaration>(`
        class Foo {
          static displayName = displayName;
        }
        function displayName() {
          return 'foo';
        }
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('foo');
    });

    it('resolves variables in displayName getter', () => {
      const definition = parse.statement<ClassDeclaration>(`
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

    it('resolves imported Identifier in displayName getter', () => {
      const definition = parse.statement<ClassDeclaration>(
        `
        class Foo {
          static get displayName() {
            return foobarbaz;
          }
        }
        import foobarbaz from 'foobarbaz';
      `,
        mockImporter,
      );
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('FooBarBaz');
    });

    it('resolves imported MemberExpression in displayName getter', () => {
      const definition = parse.statement<ClassDeclaration>(
        `
        class Foo {
          static get displayName() {
            return foo.bar;
          }
        }
        import foo from 'foo';
      `,
        mockImporter,
      );
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('baz');
    });
  });

  describe('FunctionDeclaration', () => {
    it('considers the function name', () => {
      const definition =
        parse.statement<FunctionDeclaration>('function Foo () {}');
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('does not crash if no name', () => {
      const definition = parse
        .statement<ExportDefaultDeclaration>(`export default function () {}`)
        .get('declaration') as NodePath<FunctionDeclaration>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBeUndefined();
    });

    it('considers a static displayName object property', () => {
      const definition = parse.statement<FunctionDeclaration>(`
        function Foo () {}
        Foo.displayName = 'Bar';
      `);
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves variable assigned to displayName object property', () => {
      const definition = parse.statement<FunctionDeclaration>(`
        function Foo () {}
        Foo.displayName = bar;
        var bar = 'Bar';
      `);
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves imported Identifier assigned to displayName object property', () => {
      const definition = parse.statement<FunctionDeclaration>(
        `
        function Foo () {}
        import foobarbaz from 'foobarbaz';
        Foo.displayName = foobarbaz;
      `,
        mockImporter,
      );
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('FooBarBaz');
    });

    it('resolves imported MemberExpression assigned to displayName object property', () => {
      const definition = parse.statement<FunctionDeclaration>(
        `
        function Foo () {}
        import foo from 'foo';
        Foo.displayName = foo.bar;
      `,
        mockImporter,
      );
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('baz');
    });
  });

  describe('FunctionExpression', () => {
    it('considers the variable name', () => {
      const definition = parse
        .statement('var Foo = function () {};')
        .get('declarations.0.init') as NodePath<FunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign', () => {
      const definition = parse
        .statement('Foo = function () {};')
        .get('expression.right') as NodePath<FunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName object property over variable name', () => {
      const definition = parse
        .statement<VariableDeclaration>(
          `
        var Foo = function () {};
        Foo.displayName = 'Bar';
      `,
        )
        .get('declarations.0.init') as NodePath<FunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves variable assigned to displayName object property over variable name', () => {
      const definition = parse
        .statement<VariableDeclaration>(
          `
        var Foo = function () {};
        Foo.displayName = bar;
        var bar = 'Bar';
      `,
        )
        .get('declarations.0.init') as NodePath<FunctionExpression>;
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves imported Identifier assigned to displayName object property over variable name', () => {
      const definition = parse
        .statement<VariableDeclaration>(
          `
        var Foo = function () {};
        import foobarbaz from 'foobarbaz';
        Foo.displayName = foobarbaz;
      `,
          mockImporter,
        )
        .get('declarations.0.init') as NodePath<FunctionExpression>;
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('FooBarBaz');
    });

    it('resolves imported MemberExpression assigned to displayName object property over variable name', () => {
      const definition = parse
        .statement<VariableDeclaration>(
          `
        var Foo = function () {};
        import foo from 'foo';
        Foo.displayName = foo.bar;
      `,
          mockImporter,
        )
        .get('declarations.0.init') as NodePath<FunctionExpression>;
      displayNameHandler(documentation, definition);
      expect(documentation.displayName).toBe('baz');
    });
  });

  describe('ArrowFunctionExpression', () => {
    it('considers the variable name', () => {
      const definition = parse
        .statement('var Foo = () => {};')
        .get('declarations.0.init') as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name even if wrapped', () => {
      const definition = parse
        .statement('var Foo = React.forwardRef(() => {});')
        .get(
          'declarations.0.init.arguments.0',
        ) as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name when handling forwardRef', () => {
      const definition = parse
        .statement(
          `
        var Foo = React.forwardRef(() => {});
        import React from "react";
      `,
        )
        .get('declarations.0.init') as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign', () => {
      const definition = parse
        .statement('Foo = () => {};')
        .get('expression.right') as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign even if wrapped', () => {
      const definition = parse
        .statement('Foo = React.forwardRef(() => {});')
        .get(
          'expression.right.arguments.0',
        ) as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers the variable name on assign when handling forwardRef call', () => {
      const definition = parse
        .statement(
          `
        Foo = React.forwardRef(() => {});
        import React from "react";
      `,
        )
        .get('expression.right') as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Foo');
    });

    it('considers a static displayName object property over variable name', () => {
      const definition = parse
        .statement(
          `
        var Foo = () => {};
        Foo.displayName = 'Bar';
      `,
        )
        .get('declarations.0.init') as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves a variable assigned to displayName object property over variable name', () => {
      const definition = parse
        .statement(
          `
        var Foo = () => {};
        Foo.displayName = bar;
        var bar = 'Bar';
      `,
        )
        .get('declarations.0.init') as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves imported Identifier assigned to displayName object property over variable name', () => {
      const definition = parse
        .statement(
          `
        var Foo = () => {};
        import foobarbaz from 'foobarbaz';
        Foo.displayName = foobarbaz;
      `,
          mockImporter,
        )
        .get('declarations.0.init') as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('FooBarBaz');
    });

    it('resolves imported MemberExpression assigned to displayName object property over variable name', () => {
      const definition = parse
        .statement(
          `
        var Foo = () => {};
        import foo from 'foo';
        Foo.displayName = foo.bar;
      `,
          mockImporter,
        )
        .get('declarations.0.init') as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('baz');
    });

    it('considers a static displayName object property over variable name even if wrapped', () => {
      const definition = parse
        .statement(
          `
        var Foo = React.forwardRef(() => {});
        Foo.displayName = 'Bar';
      `,
        )
        .get(
          'declarations.0.init.arguments.0',
        ) as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves a variable assigned to displayName object property over variable name even if wrapped', () => {
      const definition = parse
        .statement(
          `
        var Foo = React.forwardRef(() => {});
        Foo.displayName = bar;
        var bar = 'Bar';
      `,
        )
        .get(
          'declarations.0.init.arguments.0',
        ) as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('Bar');
    });

    it('resolves imported Identifier assigned to displayName object property over variable name even if wrapped', () => {
      const definition = parse
        .statement(
          `
        var Foo = React.forwardRef(() => {});
        import foobarbaz from 'foobarbaz';
        Foo.displayName = foobarbaz;
      `,
          mockImporter,
        )
        .get(
          'declarations.0.init.arguments.0',
        ) as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('FooBarBaz');
    });

    it('resolves imported MemberExpression assigned to displayName object property over variable name even if wrapped', () => {
      const definition = parse
        .statement(
          `
        var Foo = React.forwardRef(() => {});
        import foo from 'foo';
        Foo.displayName = foo.bar;
      `,
          mockImporter,
        )
        .get(
          'declarations.0.init.arguments.0',
        ) as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).toBe('baz');
    });

    it('ignores assignment to non-literal/identifier', () => {
      const definition = parse
        .statement('Foo.Bar = () => {};')
        .get('expression.right') as NodePath<ArrowFunctionExpression>;
      expect(() => displayNameHandler(documentation, definition)).not.toThrow();
      expect(documentation.displayName).not.toBeDefined();
    });
  });
});
