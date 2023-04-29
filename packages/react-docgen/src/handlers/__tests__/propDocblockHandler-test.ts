import type { NodePath } from '@babel/traverse';
import type { ClassDeclaration, ObjectExpression } from '@babel/types';
import { parse, makeMockImporter, noopImporter } from '../../../tests/utils';
import DocumentationBuilder from '../../Documentation';
import type { Importer } from '../../importer';
import type { ComponentNode } from '../../resolver';
import type DocumentationMock from '../../__mocks__/Documentation';
import propDocblockHandler from '../propDocblockHandler.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../Documentation.js');

describe('propDocblockHandler', () => {
  let documentation: DocumentationBuilder & DocumentationMock;

  beforeEach(() => {
    documentation = new DocumentationBuilder() as DocumentationBuilder &
      DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    props: (stmtLast) =>
      stmtLast(`
      export default {
        /**
          * A comment on imported props
          */
        foo: Prop.bool,
      };
    `).get('declaration'),
  });

  function testDocBlockHandler(
    getSrc: (src: string) => string,
    parseSrc: (src: string, importer?: Importer) => NodePath<ComponentNode>,
  ) {
    test('finds docblocks for prop types', () => {
      const definition = parseSrc(
        getSrc(
          `{
          /**
           * Foo comment
           */
          foo: Prop.bool,
          /**
           * Bar comment
           */
          bar: Prop.bool,
        }`,
        ),
      );

      propDocblockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
        bar: {
          description: 'Bar comment',
        },
      });
    });

    test('can handle multline comments', () => {
      const definition = parseSrc(
        getSrc(
          `{
          /**
           * Foo comment with
           * many lines!
           *
           * even with empty lines in between
           */
          foo: Prop.bool,
        }`,
        ),
      );

      propDocblockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description:
            'Foo comment with\nmany lines!\n\neven with empty lines in between',
        },
      });
    });

    test('ignores non-docblock comments', () => {
      const definition = parseSrc(
        getSrc(
          `{
          /**
           * Foo comment
           */
          // TODO: remove this comment
          foo: Prop.bool,
          /**
           * Bar comment
           */
          /* This is not a doc comment */
          bar: Prop.bool,
        }`,
        ),
      );

      propDocblockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
        bar: {
          description: 'Bar comment',
        },
      });
    });

    test('only considers the comment with the property below it', () => {
      const definition = parseSrc(
        getSrc(
          `{
          /**
           * Foo comment
           */
          foo: Prop.bool,
          bar: Prop.bool,
        }`,
        ),
      );

      propDocblockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
        bar: {
          description: '',
        },
      });
    });

    test('understands and ignores the spread operator', () => {
      const definition = parseSrc(
        getSrc(
          `{
          ...Bar.propTypes,
          /**
           * Foo comment
           */
          foo: Prop.bool,
        }`,
        ),
      );

      propDocblockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
      });
    });

    test('resolves variables', () => {
      const definition = parseSrc(`
        ${getSrc('Props')}
        var Props = {
          /**
           * Foo comment
           */
          foo: Prop.bool,
        };
      `);

      propDocblockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
      });
    });

    test('resolves imported variables', () => {
      const definition = parseSrc(
        `
        ${getSrc('Props')}
        import Props from 'props';
      `,
        mockImporter,
      );

      propDocblockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'A comment on imported props',
        },
      });
    });

    test('resolves imported variables that are spread', () => {
      const definition = parseSrc(
        `
        ${getSrc('Props')}
        import ExtraProps from 'props';
        var Props = {
          ...ExtraProps,
          /**
           * Bar comment
           */
          bar: Prop.bool,
        }
      `,
        mockImporter,
      );

      propDocblockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'A comment on imported props',
        },
        bar: {
          description: 'Bar comment',
        },
      });
    });
  }

  describe('React.createClass', () => {
    testDocBlockHandler(
      (propTypesSrc) => `({propTypes: ${propTypesSrc}})`,
      (src, importer = noopImporter) =>
        parse
          .statement(src, importer)
          .get('expression') as NodePath<ObjectExpression>,
    );
  });

  describe('ClassDefinition', () => {
    describe('class property', () => {
      testDocBlockHandler(
        (propTypesSrc) => `
          class Foo{
            static propTypes = ${propTypesSrc};
          }
        `,
        (src, importer = noopImporter) => parse.statement(src, importer),
      );
    });

    describe('static getter', () => {
      testDocBlockHandler(
        (propTypesSrc) => `
          class Foo{
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
        propDocblockHandler(documentation, definition),
      ).not.toThrow();
    });

    test('ClassDeclaration', () => {
      const definition = parse.statement<ClassDeclaration>('class Foo {}');

      expect(() =>
        propDocblockHandler(documentation, definition),
      ).not.toThrow();
    });
  });
});
