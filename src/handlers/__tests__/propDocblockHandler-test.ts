import type { NodePath } from '@babel/traverse';
import type { ClassDeclaration, ObjectExpression } from '@babel/types';
import { parse, makeMockImporter, noopImporter } from '../../../tests/utils';
import Documentation from '../../Documentation';
import type { Importer } from '../../importer';
import type { ComponentNode } from '../../resolver';
import type DocumentationMock from '../../__mocks__/Documentation';
import propDocBlockHandler from '../propDocBlockHandler';

jest.mock('../../Documentation');

describe('propDocBlockHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    props: stmtLast =>
      stmtLast(`
      export default {
        /**
          * A comment on imported props
          */
        foo: Prop.bool,
      };
    `).get('declaration'),
  });

  function test(
    getSrc: (src: string) => string,
    parseSrc: (src: string, importer?: Importer) => NodePath<ComponentNode>,
  ) {
    it('finds docblocks for prop types', () => {
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

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
        bar: {
          description: 'Bar comment',
        },
      });
    });

    it('can handle multline comments', () => {
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

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description:
            'Foo comment with\nmany lines!\n\neven with empty lines in between',
        },
      });
    });

    it('ignores non-docblock comments', () => {
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

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
        bar: {
          description: 'Bar comment',
        },
      });
    });

    it('only considers the comment with the property below it', () => {
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

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
        bar: {
          description: '',
        },
      });
    });

    it('understands and ignores the spread operator', () => {
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

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
      });
    });

    it('resolves variables', () => {
      const definition = parseSrc(`
        ${getSrc('Props')}
        var Props = {
          /**
           * Foo comment
           */
          foo: Prop.bool,
        };
      `);

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
      });
    });

    it('resolves imported variables', () => {
      const definition = parseSrc(
        `
        ${getSrc('Props')}
        import Props from 'props';
      `,
        mockImporter,
      );

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'A comment on imported props',
        },
      });
    });

    it('resolves imported variables that are spread', () => {
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

      propDocBlockHandler(documentation, definition);
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
    test(
      propTypesSrc => `({propTypes: ${propTypesSrc}})`,
      (src, importer = noopImporter) =>
        parse
          .statement(src, importer)
          .get('expression') as NodePath<ObjectExpression>,
    );
  });

  describe('ClassDefinition', () => {
    describe('class property', () => {
      test(
        propTypesSrc => `
          class Foo{
            static propTypes = ${propTypesSrc};
          }
        `,
        (src, importer = noopImporter) => parse.statement(src, importer),
      );
    });

    describe('static getter', () => {
      test(
        propTypesSrc => `
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
    it('ObjectExpression', () => {
      const definition = parse.expression<ObjectExpression>('{fooBar: 42}');
      expect(() =>
        propDocBlockHandler(documentation, definition),
      ).not.toThrow();
    });

    it('ClassDeclaration', () => {
      const definition = parse.statement<ClassDeclaration>('class Foo {}');
      expect(() =>
        propDocBlockHandler(documentation, definition),
      ).not.toThrow();
    });
  });
});
