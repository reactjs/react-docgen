/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();
jest.mock('../../Documentation');

describe('componentDocblockHandler', () => {
  let parse;
  let documentation;
  let componentDocblockHandler;

  function lastStatement(src) {
    const programPath = parse(src);
    return programPath.get('body', programPath.node.body.length - 1);
  }

  beforeEach(() => {
    ({ parse } = require('../../../tests/utils'));
    documentation = new (require('../../Documentation'))();
    componentDocblockHandler = require('../componentDocblockHandler').default;
  });

  function test(definitionSrc, parseFunc) {
    it('finds docblocks for component definitions', () => {
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

    it('ignores other types of comments', () => {
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

    it('only considers the docblock directly above the definition', () => {
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

        componentDocblockHandler(documentation, definition);
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

        componentDocblockHandler(documentation, definition);
        expect(documentation.description).toBe('Component description');
      });
    });
  }

  describe('React.createClass', () => {
    test('var Component = React.createClass({})', src =>
      lastStatement(src).get('declarations', 0, 'init', 'arguments', 0));
  });

  describe('ClassDeclaration', () => {
    test('class Component {}', src => lastStatement(src));
    testDecorators('class Component {}', src => lastStatement(src));
  });

  describe('ClassExpression', () => {
    test('var Component = class {};', src =>
      lastStatement(src).get('declarations', 0, 'init'));
  });

  describe('Stateless functions', () => {
    test('function Component() {}', src => lastStatement(src));
    test('var Component = function () {};', src =>
      lastStatement(src).get('declarations', 0, 'init'));
    test('var Component = () => {}', src =>
      lastStatement(src).get('declarations', 0, 'init'));
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
});
