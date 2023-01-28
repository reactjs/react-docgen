import { parse, makeMockImporter, noopImporter } from '../../../tests/utils';
import propTypeCompositionHandler from '../propTypeCompositionHandler.js';
import Documentation from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import type { NodePath } from '@babel/traverse';
import type { Importer } from '../../importer';
import type { ClassDeclaration, ObjectExpression } from '@babel/types';
import type { ComponentNode } from '../../resolver';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../Documentation.js');
vi.mock('../../utils/getPropType.js', () => () => ({}));

describe('propTypeCompositionHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    'Foo.react': (stmtLast) =>
      stmtLast(`
      function Component() {}
      Component.propTypes = {
        foo: 'bar'
      };
      export default Component;
    `).get('declaration'),

    SharedProps: (stmtLast) =>
      stmtLast(`
      export default {
        bar: 'baz'
      };
    `).get('declaration'),
  });

  function testCompositionHandler(
    getSrc: (src: string) => string,
    parseSrc: (src: string, importer?: Importer) => NodePath<ComponentNode>,
  ) {
    test('understands assignment from module', () => {
      let definition = parseSrc(`
        ${getSrc('Foo.propTypes')}
        var Foo = require("Foo.react");
      `);

      propTypeCompositionHandler(documentation, definition);
      expect(documentation.composes).toEqual(['Foo.react']);

      documentation = new Documentation() as Documentation & DocumentationMock;
      definition = parseSrc(`
        ${getSrc('SharedProps')}
        var SharedProps = require("SharedProps");
      `);

      propTypeCompositionHandler(documentation, definition);
      expect(documentation.composes).toEqual(['SharedProps']);
    });

    test('understands the spread operator', () => {
      const definitionSrc = getSrc(
        `{
          ...Foo.propTypes,
          ...SharedProps,
        }`,
      );
      const definition = parseSrc(`
        ${definitionSrc}
        var Foo = require("Foo.react");
        var SharedProps = require("SharedProps");
      `);

      propTypeCompositionHandler(documentation, definition);
      expect(documentation.composes).toEqual(['Foo.react', 'SharedProps']);
    });

    test('does not add any composes if spreads can be fully resolved with the importer', () => {
      const definitionSrc = getSrc(
        `{
          ...Foo.propTypes,
          ...SharedProps,
        }`,
      );
      const definition = parseSrc(
        `
        ${definitionSrc}
        import Foo from "Foo.react";
        import SharedProps from "SharedProps";
      `,
        mockImporter,
      );

      propTypeCompositionHandler(documentation, definition);
      expect(documentation.composes).toEqual([]);
    });

    test('still adds a composes if the importer cannot resolve a value', () => {
      const definitionSrc = getSrc(
        `{
          ...Foo.propTypes,
          ...NotFound,
        }`,
      );
      const definition = parseSrc(
        `
        ${definitionSrc}
        import Foo from "Foo.react";
        import NotFound from "NotFound";
      `,
        mockImporter,
      );

      propTypeCompositionHandler(documentation, definition);
      expect(documentation.composes).toEqual(['NotFound']);
    });
  }

  describe('React.createClass', () => {
    testCompositionHandler(
      (propTypesSrc) => `({propTypes: ${propTypesSrc}})`,
      (src, importer = noopImporter) =>
        parse
          .statement(src, importer)
          .get('expression') as NodePath<ObjectExpression>,
    );
  });

  describe('class definition', () => {
    describe('class properties', () => {
      testCompositionHandler(
        (propTypesSrc) => `
          class Component {
            static propTypes = ${propTypesSrc};
          }
        `,
        (src, importer = noopImporter) => parse.statement(src, importer),
      );
    });

    describe('static getter', () => {
      testCompositionHandler(
        (propTypesSrc) => `
          class Component {
            static get propTypes() {
              return ${propTypesSrc};
            }
          }
        `,
        (src, importer = noopImporter) => parse.statement(src, importer),
      );
    });
  });

  describe('does not error if propTypes cannot be found', () => {
    test('ObjectExpression', () => {
      const definition = parse.expression<ObjectExpression>('{fooBar: 42}');

      expect(() =>
        propTypeCompositionHandler(documentation, definition),
      ).not.toThrow();
    });

    test('ClassDeclaration', () => {
      const definition = parse.statement<ClassDeclaration>('class Foo {}');

      expect(() =>
        propTypeCompositionHandler(documentation, definition),
      ).not.toThrow();
    });
  });
});
