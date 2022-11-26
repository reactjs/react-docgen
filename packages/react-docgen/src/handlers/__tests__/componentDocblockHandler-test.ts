import { makeMockImporter, parse } from '../../../tests/utils';
import componentDocblockHandler from '../componentDocblockHandler.js';
import Documentation from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import type { NodePath } from '@babel/traverse';
import type {
  ArrowFunctionExpression,
  CallExpression,
  ClassDeclaration,
  ClassExpression,
  ExportDefaultDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  ObjectExpression,
  VariableDeclaration,
} from '@babel/types';
import type { ComponentNode } from '../../resolver';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../Documentation.js');

describe('componentDocblockHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  function testDockblockHandler(
    definitionSrc: string,
    parseFunc: (src: string) => NodePath<ComponentNode>,
  ) {
    test('finds docblocks for component definitions', () => {
      const definition = parseFunc(`
        import something from 'somewhere';

        /**
         * Component description
         */
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition);
      expect(documentation.description).toBe('Component description');
    });

    test('ignores other types of comments', () => {
      let definition = parseFunc(`
        import something from 'somewhere';

        /*
         * This is not a docblock',
         */
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition);
      expect(documentation.description).toBe('');

      definition = parseFunc(`
        // Inline comment'
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition);
      expect(documentation.description).toBe('');
    });

    test('only considers the docblock directly above the definition', () => {
      const definition = parseFunc(`
        import something from 'somewhere';

        /**
         * This is the wrong docblock
         */
        var something_else = "foo";
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition);
      expect(documentation.description).toBe('');
    });
  }

  /**
   * Decorates can only be assigned to class and therefore only make sense for
   * class declarations and export declarations.
   */
  function testDecorators(
    classSrc: string,
    parseFunc: (src: string) => NodePath<ComponentNode>,
    exportSrc = '',
  ) {
    describe('decorators', () => {
      test("uses the docblock above the decorator if it's the only one", () => {
        const definition = parseFunc(`
          import something from 'somewhere';
          /**
           * Component description
           */
          ${exportSrc}
          @Decorator1
          @Decorator2
          ${classSrc}
        `);

        componentDocblockHandler(documentation, definition);
        expect(documentation.description).toBe('Component description');
      });

      test('uses the component docblock if present', () => {
        const definition = parseFunc(`
          import something from 'somewhere';

          ${exportSrc}
          /**
          * Decorator description
          */
          @Decorator1
          @Decorator2
          /**
           * Component description
           */
          ${classSrc}
        `);

        componentDocblockHandler(documentation, definition);
        expect(documentation.description).toBe('Component description');
      });
    });
  }

  function testImports(
    exportSrc: string,
    importName: string,
    useDefault = false,
  ) {
    const importDef = useDefault ? `${importName}` : `{ ${importName} }`;

    const mockImporter = makeMockImporter({
      test1: stmtLast =>
        stmtLast(
          `
        /**
        * Component description
        */
        ${exportSrc}
      `,
          false,
          0,
        ).get('declaration') as NodePath,

      test2: stmtLast =>
        stmtLast<ExportDefaultDeclaration>(`
        import ${importDef} from 'test1';
        export default ${importName};
      `).get('declaration'),
    });

    describe('imports', () => {
      test('can use a custom importer to resolve docblocks on imported components', () => {
        const program = parse
          .statementLast(
            `import ${importDef} from 'test1';
             export default ${importName};`,
            mockImporter,
          )
          .get('declaration') as NodePath<ComponentNode>;

        componentDocblockHandler(documentation, program);
        expect(documentation.description).toBe('Component description');
      });
    });

    test('traverses multiple imports', () => {
      const program = parse
        .statementLast(
          `import ${importDef} from 'test2';
           export default ${importName};`,
          mockImporter,
        )
        .get('declaration') as NodePath<ComponentNode>;

      componentDocblockHandler(documentation, program);
      expect(documentation.description).toBe('Component description');
    });
  }

  describe('React.createClass', () => {
    testDockblockHandler(
      'var Component = React.createClass({})',
      src =>
        parse
          .statementLast(src)
          .get('declarations.0.init.arguments.0') as NodePath<ObjectExpression>,
    );
    testImports('export var Component = React.createClass({})', 'Component');
  });

  describe('ClassDeclaration', () => {
    testDockblockHandler('class Component {}', src => parse.statementLast(src));
    testDecorators('class Component {}', src => parse.statementLast(src));
    testImports('export class Component {}', 'Component');
  });

  describe('ClassExpression', () => {
    testDockblockHandler(
      'var Component = class {};',
      src =>
        parse
          .statementLast<VariableDeclaration>(src)
          .get('declarations.0.init') as NodePath<ClassExpression>,
    );
    testImports('export var Component = class {};', 'Component');
  });

  describe('Stateless functions', () => {
    testDockblockHandler('function Component() {}', src =>
      parse.statementLast(src),
    );
    testImports('export function Component() {}', 'Component');
    testDockblockHandler(
      'var Component = function () {};',
      src =>
        parse
          .statementLast<VariableDeclaration>(src)
          .get('declarations.0.init') as NodePath<FunctionExpression>,
    );
    testImports('export var Component = function () {};', 'Component');
    testDockblockHandler(
      'var Component = () => {}',
      src =>
        parse
          .statementLast<VariableDeclaration>(src)
          .get('declarations.0.init') as NodePath<ArrowFunctionExpression>,
    );
    testImports('export var Component = () => {}', 'Component');
  });

  describe('ESM default export', () => {
    describe('Default React.createClass export', () => {
      testDockblockHandler(
        'export default React.createClass({});',
        src =>
          parse
            .statementLast(src)
            .get('declaration.arguments.0') as NodePath<ObjectExpression>,
      );
    });

    describe('Default class declaration export', () => {
      testDockblockHandler(
        'export default class Component {}',
        src =>
          parse
            .statementLast(src)
            .get('declaration') as NodePath<ClassDeclaration>,
      );
      testDecorators(
        'class Component {}',
        src =>
          parse
            .statementLast(src)
            .get('declaration') as NodePath<ClassDeclaration>,
        'export default',
      );
    });

    describe('Default class expression export', () => {
      testDockblockHandler(
        'export default class {}',
        src =>
          parse
            .statementLast(src)
            .get('declaration') as NodePath<ClassExpression>,
      );
      testDecorators(
        'class {}',
        src =>
          parse
            .statementLast(src)
            .get('declaration') as NodePath<ClassExpression>,
        'export default',
      );
    });

    describe('Default stateless function export', () => {
      describe('named function', () => {
        testDockblockHandler(
          'export default function Component() {}',
          src =>
            parse
              .statementLast(src)
              .get('declaration') as NodePath<FunctionDeclaration>,
        );
      });

      describe('anonymous function', () => {
        testDockblockHandler(
          'export default function() {}',
          src =>
            parse
              .statementLast(src)
              .get('declaration') as NodePath<FunctionDeclaration>,
        );
      });

      describe('arrow function', () => {
        testDockblockHandler(
          'export default () => {}',
          src =>
            parse
              .statementLast<ExportDefaultDeclaration>(src)
              .get('declaration') as NodePath<ArrowFunctionExpression>,
        );
      });
    });
  });

  describe('ESM named export', () => {
    describe('Named React.createClass export', () => {
      testDockblockHandler(
        'export var Component = React.createClass({});',
        src =>
          parse
            .statementLast(src)
            .get(
              'declaration.declarations.0.init.arguments.0',
            ) as NodePath<ObjectExpression>,
      );
    });

    describe('Named class declaration export', () => {
      testDockblockHandler(
        'export class Component {}',
        src =>
          parse
            .statementLast(src)
            .get('declaration') as NodePath<ClassDeclaration>,
      );
      testDecorators(
        'class Component {}',
        src =>
          parse
            .statementLast(src)
            .get('declaration') as NodePath<ClassDeclaration>,
        'export',
      );
    });

    describe('Named stateless function', () => {
      describe('named function', () => {
        testDockblockHandler(
          'export function Component() {}',
          src =>
            parse
              .statementLast(src)
              .get('declaration') as NodePath<FunctionDeclaration>,
        );
      });

      describe('anonymous function', () => {
        testDockblockHandler(
          'export var Component = function() {}',
          src =>
            parse
              .statementLast(src)
              .get('declaration') as NodePath<FunctionExpression>,
        );
      });

      describe('arrow function', () => {
        testDockblockHandler(
          'export var Component = () => {}',
          src =>
            parse
              .statementLast(src)
              .get('declaration') as NodePath<ArrowFunctionExpression>,
        );
      });
    });
  });

  describe('forwardRef', () => {
    const useDefault = true;

    describe('inline implementation', () => {
      testDockblockHandler(
        `
        React.forwardRef((props, ref) => {});
        import React from "react";`,
        src =>
          parse
            .statement(src, -2)
            .get('expression') as NodePath<CallExpression>,
      );

      testImports(
        `import React from 'react';
         export default React.forwardRef((props, ref) => {});`,
        'RefComponent',
        useDefault,
      );
    });

    describe('inline implementation with memo', () => {
      testDockblockHandler(
        `
        React.memo(React.forwardRef((props, ref) => {}));
        import React from "react";
        `,
        src =>
          parse
            .statement(src, -2)
            .get('expression') as NodePath<CallExpression>,
      );

      testImports(
        `
         export default React.memo(React.forwardRef((props, ref) => {}));
         import React from 'react';
        `,
        'RefComponent',
        useDefault,
      );
    });

    describe('out of line implementation', () => {
      testDockblockHandler(
        `
        let Component = (props, ref) => {};
        React.forwardRef(Component);
        import React from "react";
        `,
        src =>
          parse
            .statement(src, -2)
            .get('expression') as NodePath<CallExpression>,
      );

      testImports(
        `
         let Component = (props, ref) => {};
         export default React.forwardRef(Component);
         import React from 'react';
        `,
        `RefComponent`,
        useDefault,
      );
    });
  });
});
