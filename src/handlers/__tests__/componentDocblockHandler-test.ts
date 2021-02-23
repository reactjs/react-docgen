import { parse, noopImporter, makeMockImporter } from '../../../tests/utils';
import componentDocblockHandler from '../componentDocblockHandler';
import Documentation from '../../Documentation';
import DocumentationMock from '../../__mocks__/Documentation';
import { NodePath } from 'ast-types/lib/node-path';

jest.mock('../../Documentation');

describe('componentDocblockHandler', () => {
  let documentation: Documentation & DocumentationMock;

  function lastStatement(src: string): NodePath {
    const programPath = parse(src);
    return programPath.get('body', programPath.node.body.length - 1);
  }

  function beforeLastStatement(src: string): NodePath {
    const programPath = parse(src);
    return programPath.get('body', programPath.node.body.length - 2);
  }

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  function test(definitionSrc: string, parseFunc: (src: string) => NodePath) {
    it('finds docblocks for component definitions', () => {
      const definition = parseFunc(`
        import something from 'somewhere';

        /**
         * Component description
         */
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition, noopImporter);
      expect(documentation.description).toBe('Component description');
    });

    it('ignores other types of comments', () => {
      let definition = parseFunc(`
        import something from 'somewhere';

        /*
         * This is not a docblock',
         */
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition, noopImporter);
      expect(documentation.description).toBe('');

      definition = parseFunc(`
        // Inline comment'
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition, noopImporter);
      expect(documentation.description).toBe('');
    });

    it('only considers the docblock directly above the definition', () => {
      const definition = parseFunc(`
        import something from 'somewhere';

        /**
         * This is the wrong docblock
         */
        var something_else = "foo";
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition, noopImporter);
      expect(documentation.description).toBe('');
    });
  }

  /**
   * Decorates can only be assigned to class and therefore only make sense for
   * class declarations and export declarations.
   */
  function testDecorators(classSrc, parseFunc, exportSrc = '') {
    describe('decorators', () => {
      it("uses the docblock above the decorator if it's the only one", () => {
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

        componentDocblockHandler(documentation, definition, noopImporter);
        expect(documentation.description).toBe('Component description');
      });

      it('uses the component docblock if present', () => {
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

        componentDocblockHandler(documentation, definition, noopImporter);
        expect(documentation.description).toBe('Component description');
      });
    });
  }

  function testImports(exportSrc, parseFunc, importName, useDefault = false) {
    const importDef = useDefault ? `${importName}` : `{ ${importName} }`;

    const mockImporter = makeMockImporter({
      test1: parseFunc(`
        /**
        * Component description
        */
        ${exportSrc}
      `),

      test2: lastStatement(`
        import ${importDef} from 'test1';

        export default ${importName};
      `).get('declaration'),
    });

    describe('imports', () => {
      it('can use a custom importer to resolve docblocks on imported components', () => {
        const program = lastStatement(`
          import ${importDef} from 'test1';

          export default ${importName};
        `).get('declaration');

        componentDocblockHandler(documentation, program, mockImporter);
        expect(documentation.description).toBe('Component description');
      });
    });

    it('traverses multiple imports', () => {
      const program = lastStatement(`
        import ${importDef} from 'test2';

        export default ${importName};
      `).get('declaration');

      componentDocblockHandler(documentation, program, mockImporter);
      expect(documentation.description).toBe('Component description');
    });
  }

  describe('React.createClass', () => {
    test('var Component = React.createClass({})', src =>
      lastStatement(src).get('declarations', 0, 'init', 'arguments', 0));
    testImports(
      'export var Component = React.createClass({})',
      src => lastStatement(src).get('declaration'),
      'Component',
    );
  });

  describe('ClassDeclaration', () => {
    test('class Component {}', src => lastStatement(src));
    testDecorators('class Component {}', src => lastStatement(src));
    testImports(
      'export class Component {}',
      src => lastStatement(src).get('declaration'),
      'Component',
    );
  });

  describe('ClassExpression', () => {
    test('var Component = class {};', src =>
      lastStatement(src).get('declarations', 0, 'init'));
    testImports(
      'export var Component = class {};',
      src => lastStatement(src).get('declaration'),
      'Component',
    );
  });

  describe('Stateless functions', () => {
    test('function Component() {}', src => lastStatement(src));
    testImports(
      'export function Component() {}',
      src => lastStatement(src).get('declaration'),
      'Component',
    );
    test('var Component = function () {};', src =>
      lastStatement(src).get('declarations', 0, 'init'));
    testImports(
      'export var Component = function () {};',
      src => lastStatement(src).get('declaration'),
      'Component',
    );
    test('var Component = () => {}', src =>
      lastStatement(src).get('declarations', 0, 'init'));
    testImports(
      'export var Component = () => {}',
      src => lastStatement(src).get('declaration'),
      'Component',
    );
  });

  describe('ES6 default exports', () => {
    describe('Default React.createClass export', () => {
      test('export default React.createClass({});', src =>
        lastStatement(src).get('declaration', 'arguments', 0));
    });

    describe('Default class declaration export', () => {
      test('export default class Component {}', src =>
        lastStatement(src).get('declaration'));
      testDecorators(
        'class Component {}',
        src => lastStatement(src).get('declaration'),
        'export default',
      );
    });

    describe('Default class expression export', () => {
      test('export default class {}', src =>
        lastStatement(src).get('declaration'));
      testDecorators(
        'class {}',
        src => lastStatement(src).get('declaration'),
        'export default',
      );
    });

    describe('Default stateless function export', () => {
      describe('named function', () => {
        test('export default function Component() {}', src =>
          lastStatement(src).get('declaration'));
      });

      describe('anonymous function', () => {
        test('export default function() {}', src =>
          lastStatement(src).get('declaration'));
      });

      describe('arrow function', () => {
        test('export default () => {}', src =>
          lastStatement(src).get('declaration'));
      });
    });
  });

  describe('ES6 named exports', () => {
    describe('Named React.createClass export', () => {
      test('export var Component = React.createClass({});', src =>
        lastStatement(src).get(
          'declaration',
          'declarations',
          '0',
          'init',
          'arguments',
          0,
        ));
    });

    describe('Named class declaration export', () => {
      test('export class Component {}', src =>
        lastStatement(src).get('declaration'));
      testDecorators(
        'class Component {}',
        src => lastStatement(src).get('declaration'),
        'export',
      );
    });

    describe('Named stateless function', () => {
      describe('named function', () => {
        test('export function Component() {}', src =>
          lastStatement(src).get('declaration'));
      });

      describe('anonymous function', () => {
        test('export var Component = function() {}', src =>
          lastStatement(src).get('declaration'));
      });

      describe('arrow function', () => {
        test('export var Component = () => {}', src =>
          lastStatement(src).get('declaration'));
      });
    });
  });

  describe('forwardRef', () => {
    const useDefault = true;

    describe('inline implementation', () => {
      test(`
        React.forwardRef((props, ref) => {});
        import React from "react";`, src =>
        beforeLastStatement(src).get('expression'));

      testImports(
        `
        export default React.forwardRef((props, ref) => {});
        import React from 'react';`,
        src => beforeLastStatement(src).get('declaration'),
        'RefComponent',
        useDefault,
      );
    });

    describe('out of line implementation', () => {
      test(`let Component = (props, ref) => {};
        React.forwardRef(Component);
        import React from "react";
        `, src => beforeLastStatement(src).get('expression'));

      testImports(
        `
        let Component = (props, ref) => {};
        export default React.forwardRef(Component);
        import React from 'react';
        `,
        src => beforeLastStatement(src).get('declaration'),
        `RefComponent`,
        useDefault,
      );
    });
  });
});
