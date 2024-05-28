import type {
  ArrowFunctionExpression,
  ClassDeclaration,
  VariableDeclaration,
} from '@babel/types';
import { parse, parseTypescript } from '../../../tests/utils';
import getTypeFromReactComponent from '../getTypeFromReactComponent.js';
import { describe, expect, test } from 'vitest';
import type { NodePath } from '@babel/traverse';

describe('getTypeFromReactComponent', () => {
  test('handles no stateless props', () => {
    const path = parseTypescript
      .statementLast<VariableDeclaration>(`const x = () => {}`)
      .get('declarations')[0]
      .get('init') as NodePath<ArrowFunctionExpression>;

    expect(getTypeFromReactComponent(path)).toMatchSnapshot();
  });

  test('handles no class props', () => {
    const path = parseTypescript.statementLast<ClassDeclaration>(
      `import React from 'react';
       class X extends React.Component {
         render() {}
       }`,
    );

    expect(getTypeFromReactComponent(path)).toMatchSnapshot();
  });

  describe('TypeScript', () => {
    describe('stateless', () => {
      test('finds param type annotation', () => {
        const path = parseTypescript
          .statementLast<VariableDeclaration>(`const x = (props: Props) => {}`)
          .get('declarations')[0]
          .get('init') as NodePath<ArrowFunctionExpression>;

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });

      test('finds wrapped param type annotation', () => {
        const path = parseTypescript
          .statementLast<VariableDeclaration>(
            `import React from 'react';
             const x = (props: React.PropsWithChildren<Props>) => {}`,
          )
          .get('declarations')[0]
          .get('init') as NodePath<ArrowFunctionExpression>;

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });

      test('finds generic forwardRef type annotation', () => {
        const path = parseTypescript
          .statementLast<VariableDeclaration>(
            `import React from 'react';
             const x = React.forwardRef<HTMLDivElement, React.PropsWithChildren<Props>>((props, ref) => {})`,
          )
          .get('declarations')[0]
          .get('init') as NodePath<ArrowFunctionExpression>;

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });

      test('finds param inline type', () => {
        const path = parseTypescript
          .statementLast<VariableDeclaration>(
            `const x = (props: { prop: string }) => {}`,
          )
          .get('declarations')[0]
          .get('init') as NodePath<ArrowFunctionExpression>;

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });

      describe.each([
        'FunctionComponent',
        'FC',
        'VoidFunctionComponent',
        'VFC',
      ])('finds variable type annotation (%s)', (name) => {
        test('with MemberExpression', () => {
          const path = parseTypescript
            .statementLast<VariableDeclaration>(
              `import React from 'react';
               const x: React.${name}<Props> = (props) => {}`,
            )
            .get('declarations')[0]
            .get('init') as NodePath<ArrowFunctionExpression>;

          expect(getTypeFromReactComponent(path)).toMatchSnapshot();
        });

        test('with named import', () => {
          const path = parseTypescript
            .statementLast<VariableDeclaration>(
              `import { ${name} } from 'react';
               const x: ${name}<Props> = (props) => {}`,
            )
            .get('declarations')[0]
            .get('init') as NodePath<ArrowFunctionExpression>;

          expect(getTypeFromReactComponent(path)).toMatchSnapshot();
        });
      });

      test('finds multiple variable type annotation', () => {
        const path = parseTypescript
          .statementLast<VariableDeclaration>(
            `import React from 'react';
             const x: React.FC<Props> = (props: Props) => {}`,
          )
          .get('declarations')[0]
          .get('init') as NodePath<ArrowFunctionExpression>;

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });
    });

    describe('classes', () => {
      test('finds props type in params', () => {
        const path = parseTypescript.statementLast<ClassDeclaration>(
          `import React from 'react';
             class X extends React.Component<Props, State> {
               render() {}
             }`,
        );

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });

      test('finds props type in properties', () => {
        const path = parseTypescript.statementLast<ClassDeclaration>(
          `import React from 'react';
           class X extends React.Component {
             props: Props;
             render() {}
           }`,
        );

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });
    });
  });

  describe('Flow', () => {
    describe('stateless', () => {
      test('finds param type annotation', () => {
        const path = parse
          .statementLast<VariableDeclaration>(`const x = (props: Props) => {}`)
          .get('declarations')[0]
          .get('init') as NodePath<ArrowFunctionExpression>;

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });

      test('finds param inline type', () => {
        const path = parse
          .statementLast<VariableDeclaration>(
            `const x = (props: { prop: string }) => {}`,
          )
          .get('declarations')[0]
          .get('init') as NodePath<ArrowFunctionExpression>;

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });
    });

    describe('classes', () => {
      test('finds props type in new params', () => {
        const path = parse.statementLast<ClassDeclaration>(
          `import React from 'react';
             class X extends React.Component<Props, State> {
               render() {}
             }`,
        );

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });

      test('finds props type in old params', () => {
        const path = parse.statementLast<ClassDeclaration>(
          `import React from 'react';
             class X extends React.Component<DefaultProps, Props, State> {
               render() {}
             }`,
        );

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });

      test('finds props type in properties', () => {
        const path = parse.statementLast<ClassDeclaration>(
          `import React from 'react';
           class X extends React.Component {
             props: Props;
             render() {}
           }`,
        );

        expect(getTypeFromReactComponent(path)).toMatchSnapshot();
      });
    });
  });
});
