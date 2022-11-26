import type { NodePath } from '@babel/traverse';
import type { StringLiteral } from '@babel/types';
import { parse, makeMockImporter, noopImporter } from '../../../tests/utils';
import type { Importer } from '../../importer';
import findFunctionReturn from '../findFunctionReturn.js';
import { describe, expect, test } from 'vitest';

const predicate = (path: NodePath): boolean =>
  path.isStringLiteral() &&
  (path.node.value === 'value' || path.node.value === 'wrong');

const value = '"value"';

function expectValue(received: NodePath | undefined) {
  expect(received).not.toBeUndefined();
  expect(received?.node.type).toBe('StringLiteral');
  expect((received?.node as StringLiteral).value).toBe('value');
}

describe('findFunctionReturn', () => {
  const wrongFunction = `const wrong = () => "wrong";`;
  const functionStyle: Record<
    string,
    [(name: string, expr: string) => string, string]
  > = {
    ArrowExpression: [
      (name: string, expr: string): string => `var ${name} = () => (${expr});`,
      'declarations.0.init',
    ],
    ArrowBlock: [
      (name: string, expr: string): string =>
        `var ${name} = () => { ${wrongFunction}return (${expr}); };`,
      'declarations.0.init',
    ],
    FunctionExpression: [
      (name: string, expr: string): string =>
        `var ${name} = function () { ${wrongFunction}return (${expr}); }`,
      'declarations.0.init',
    ],
    FunctionDeclaration: [
      (name: string, expr: string): string =>
        `function ${name} () { ${wrongFunction}return (${expr}); }`,
      '',
    ],
  };

  const modifiers = {
    default: (): string => value,
    'conditional consequent': (): string => `x ? ${value} : null`,
    'conditional alternate': (): string => `x ? null : ${value}`,
    'OR left': (): string => `${value} || null`,
    'AND right': (): string => `x && ${value}`,
  };

  type ComponentFactory = (name: string, expression: string) => string;

  const cases = {
    'no reference': [
      (expr: string, componentFactory: ComponentFactory): string =>
        `${componentFactory('Foo', expr)}`,
      'body.0',
    ],
    'with Identifier reference': [
      (expr: string, componentFactory: ComponentFactory): string => `
        var variable = (${expr});
        ${componentFactory('Foo', 'variable')}
      `,
      'body.1',
    ],
  };

  Object.entries(functionStyle).forEach(([name, style]) => {
    cases[`with ${name} reference`] = [
      (expr: string, componentFactory: ComponentFactory): string => `
        ${style[0]('subfunc', expr)}
        ${componentFactory('Foo', 'subfunc()')}
      `,
      'body.1',
    ];
  });

  const negativeModifiers = {
    'nested ArrowExpression': (expr: string): string => `() => ${expr}`,
    'nested ArrowBlock': (expr: string): string => `() => { return ${expr} }`,
    'nested FunctionExpression': (expr: string): string =>
      `function () { return ${expr} }`,
  };

  Object.keys(cases).forEach(name => {
    const [caseFactory, caseSelector] = cases[name];

    describe(name, () => {
      Object.entries(functionStyle).forEach(
        ([functionName, [functionFactory, functionSelector]]) => {
          describe(functionName, () => {
            Object.keys(modifiers).forEach(modifierName => {
              const modifierFactory = modifiers[modifierName];

              test(modifierName, () => {
                const code = caseFactory(modifierFactory(), functionFactory);
                const def: NodePath = parse(code).get(
                  `${caseSelector}.${functionSelector}`.replace(/\.$/, ''),
                ) as NodePath;

                expectValue(findFunctionReturn(def, predicate));
              });
            });

            Object.keys(negativeModifiers).forEach(modifierName => {
              const modifierFactory = negativeModifiers[modifierName];

              test(modifierName, () => {
                const code = caseFactory(modifierFactory(), functionFactory);

                const def: NodePath = parse(code).get(
                  `${caseSelector}.${functionSelector}`.replace(/\.$/, ''),
                ) as NodePath;

                expect(findFunctionReturn(def, predicate)).toBeUndefined();
              });
            });
          });
        },
      );
    });
  });

  describe('resolving return values', () => {
    function testReturnValues(
      desc: string,
      src: string,
      importer: Importer = noopImporter,
    ) {
      test(desc, () => {
        const def = parse(src, importer).get('body')[0];

        expectValue(findFunctionReturn(def, predicate));
      });
    }

    const mockImporter = makeMockImporter({
      bar: stmtLast => stmtLast(`export default "value";`).get('declaration'),
    });

    test('handles recursive function calls', () => {
      const def = parse.statement(`
        function Foo (props) {
          return props && Foo(props);
        }
      `);

      expect(findFunctionReturn(def, predicate)).toBeUndefined();
    });

    testReturnValues(
      'does not see ifs as separate block',
      `
      function Foo (props) {
        if (x) {
          return "value";
        }
      }
    `,
    );

    testReturnValues(
      'handles simple resolves',
      `
      function Foo (props) {
        function bar() {
          return "value";
        }

        return bar();
      }
    `,
    );

    testReturnValues(
      'handles reference resolves',
      `
      function Foo (props) {
        var result = bar();

        return result;

        function bar() {
          return "value";
        }
      }
    `,
    );

    testReturnValues(
      'handles shallow member call expression resolves',
      `
      function Foo (props) {
        var shallow = {
          shallowMember() {
            return "value";
          }
        };

        return shallow.shallowMember();
      }
    `,
    );

    testReturnValues(
      'handles deep member call expression resolves',
      `
      function Foo (props) {
        var obj = {
          deep: {
            member() {
              return "value";
            }
          }
        };

        return obj.deep.member();
      }
    `,
    );

    testReturnValues(
      'handles external reference member call expression resolves',
      `
      function Foo (props) {
        var member = () => "value";
        var obj = {
          deep: {
            member: member
          }
        };

        return obj.deep.member();
      }
    `,
    );

    testReturnValues(
      'handles all sorts of JavaScript things',
      `
      function Foo (props) {
        var external = {
          member: () => "value"
        };
        var obj = {external};

        return obj.external.member();
      }
    `,
    );

    testReturnValues(
      'resolves imported values as return',
      `
      function Foo (props) {
        return bar;
      }
      import bar from 'bar';
      `,
      mockImporter,
    );
  });
});
