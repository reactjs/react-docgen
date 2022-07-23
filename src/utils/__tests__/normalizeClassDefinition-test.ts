import type { NodePath } from '@babel/traverse';
import type {
  AssignmentExpression,
  ClassDeclaration,
  ClassExpression,
  ClassProperty,
  ExportDefaultDeclaration,
  ExpressionStatement,
  Identifier,
  NumericLiteral,
  VariableDeclaration,
} from '@babel/types';
import { parse } from '../../../tests/utils';
import normalizeClassDefinition from '../normalizeClassDefinition';

describe('normalizeClassDefinition', () => {
  it('finds assignments to class declarations', () => {
    const classDefinition = parse.statement<ClassDeclaration>(`
      class Foo {}
      Foo.propTypes = 42;
    `);

    normalizeClassDefinition(classDefinition);
    const classProperty = classDefinition.node.body.body[0] as ClassProperty;

    expect(classProperty).toBeDefined();
    expect((classProperty.key as Identifier).name).toBe('propTypes');
    expect((classProperty.value as NumericLiteral).value).toBe(42);
    expect(classProperty.static).toBe(true);
  });

  it('should not fail on classes without ids', () => {
    const classDefinition = parse
      .statement<ExportDefaultDeclaration>(
        `
      export default class extends React.Component {
        static propTypes = 42;
      }
    `,
      )
      .get('declaration') as NodePath<ClassDeclaration>;

    normalizeClassDefinition(classDefinition);
    const classProperty = classDefinition.node.body.body[0] as ClassProperty;

    expect(classProperty).toBeDefined();
  });

  it('finds assignments to class expressions with variable declaration', () => {
    const classDefinition = parse
      .statement<VariableDeclaration>(
        `
      var Foo = class {};
      Foo.propTypes = 42;
    `,
      )
      .get('declarations')[0]
      .get('init') as NodePath<ClassExpression>;

    normalizeClassDefinition(classDefinition);
    const classProperty = classDefinition.node.body.body[0] as ClassProperty;

    expect(classProperty).toBeDefined();
    expect((classProperty.key as Identifier).name).toBe('propTypes');
    expect((classProperty.value as NumericLiteral).value).toBe(42);
    expect(classProperty.static).toBe(true);
  });

  it('finds assignments to class expressions with assignment', () => {
    const classDefinition = (
      parse
        .statement<ExpressionStatement>(
          `var Foo;
           Foo = class {};
           Foo.propTypes = 42;`,
          1,
        )
        .get('expression') as NodePath<AssignmentExpression>
    ).get('right') as NodePath<ClassExpression>;

    normalizeClassDefinition(classDefinition);
    const classProperty = classDefinition.node.body.body[0] as ClassProperty;

    expect(classProperty).toBeDefined();
    expect((classProperty.key as Identifier).name).toBe('propTypes');
    expect((classProperty.value as NumericLiteral).value).toBe(42);
    expect(classProperty.static).toBe(true);
  });

  it('ignores assignments further up the tree', () => {
    const classDefinition = parse
      .statement(
        `
      var Foo = function() {
        (class {});
      };
      Foo.bar = 42;
    `,
      )
      .get('declarations')[0]
      .get('init')
      .get('body')
      .get('body')[0]
      .get('expression');

    normalizeClassDefinition(classDefinition);
    const classProperty = classDefinition.node.body.body[0] as ClassProperty;

    expect(classProperty).not.toBeDefined();
  });
});
