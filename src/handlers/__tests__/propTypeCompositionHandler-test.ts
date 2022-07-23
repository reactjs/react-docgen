import { parse, makeMockImporter, noopImporter } from '../../../tests/utils';
import propTypeCompositionHandler from '../propTypeCompositionHandler';
import Documentation from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import type { NodePath } from '@babel/traverse';
import type { Importer } from '../../importer';
import type { ExpressionStatement } from '@babel/types';

jest.mock('../../Documentation');
jest.mock('../../utils/getPropType', () => () => ({}));

describe('propTypeCompositionHandler', () => {
  let documentation: Documentation & DocumentationMock;

  beforeEach(() => {
    documentation = new Documentation() as Documentation & DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    'Foo.react': stmtLast =>
      stmtLast(`
      function Component() {}
      Component.propTypes = {
        foo: 'bar'
      };
      export default Component;
    `).get('declaration'),

    SharedProps: stmtLast =>
      stmtLast(`
      export default {
        bar: 'baz'
      };
    `).get('declaration'),
  });

  function test(
    getSrc: (src: string) => string,
    parseSrc: (src: string, importer?: Importer) => NodePath,
  ) {
    it('understands assignment from module', () => {
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

    it('understands the spread operator', () => {
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

    it('does not add any composes if spreads can be fully resolved with the importer', () => {
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

    it('still adds a composes if the importer cannot resolve a value', () => {
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
    test(
      propTypesSrc => `({propTypes: ${propTypesSrc}})`,
      (src, importer = noopImporter) =>
        parse.statement<ExpressionStatement>(src, importer).get('expression'),
    );
  });

  describe('class definition', () => {
    describe('class properties', () => {
      test(
        propTypesSrc => `
          class Component {
            static propTypes = ${propTypesSrc};
          }
        `,
        (src, importer = noopImporter) => parse.statement(src, importer),
      );
    });

    describe('static getter', () => {
      test(
        propTypesSrc => `
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

  it('does not error if propTypes cannot be found', () => {
    let definition = parse.expression('{fooBar: 42}');
    expect(() =>
      propTypeCompositionHandler(documentation, definition),
    ).not.toThrow();

    definition = parse.statement('class Foo {}');
    expect(() =>
      propTypeCompositionHandler(documentation, definition),
    ).not.toThrow();
  });
});
