import type { TSTypeReference, VariableDeclaration } from '@babel/types';
import { parseTypescript } from '../../../tests/utils';
import unwrapBuiltinTSPropTypes from '../unwrapBuiltinTSPropTypes.js';
import { describe, expect, test } from 'vitest';
import type { NodePath } from '@babel/traverse';

describe('unwrapBuiltinTSPropTypes', () => {
  test('React.PropsWithChildren', () => {
    const path = parseTypescript
      .statementLast<VariableDeclaration>(
        `import React from 'react';
         var foo: React.PropsWithChildren<Props>`,
      )
      .get(
        'declarations.0.id.typeAnnotation.typeAnnotation',
      ) as NodePath<TSTypeReference>;

    expect(unwrapBuiltinTSPropTypes(path)).toMatchSnapshot();
  });

  test('React.PropsWithoutRef', () => {
    const path = parseTypescript
      .statementLast<VariableDeclaration>(
        `import React from 'react';
         var foo: React.PropsWithoutRef<Props>`,
      )
      .get(
        'declarations.0.id.typeAnnotation.typeAnnotation',
      ) as NodePath<TSTypeReference>;

    expect(unwrapBuiltinTSPropTypes(path)).toMatchSnapshot();
  });

  test('React.PropsWithRef', () => {
    const path = parseTypescript
      .statementLast<VariableDeclaration>(
        `import React from 'react';
         var foo: React.PropsWithRef<Props>`,
      )
      .get(
        'declarations.0.id.typeAnnotation.typeAnnotation',
      ) as NodePath<TSTypeReference>;

    expect(unwrapBuiltinTSPropTypes(path)).toMatchSnapshot();
  });

  test('multiple', () => {
    const path = parseTypescript
      .statementLast<VariableDeclaration>(
        `import React from 'react';
         var foo: React.PropsWithChildren<React.PropsWithRef<Props>>`,
      )
      .get(
        'declarations.0.id.typeAnnotation.typeAnnotation',
      ) as NodePath<TSTypeReference>;

    expect(unwrapBuiltinTSPropTypes(path)).toMatchSnapshot();
  });

  test('does not follow reassignment', () => {
    const path = parseTypescript
      .statementLast<VariableDeclaration>(
        `import React from 'react';
         type bar = React.PropsWithRef<Props>
         var foo: React.PropsWithChildren<bar>`,
      )
      .get(
        'declarations.0.id.typeAnnotation.typeAnnotation',
      ) as NodePath<TSTypeReference>;

    expect(unwrapBuiltinTSPropTypes(path)).toMatchSnapshot();
  });

  test('with require', () => {
    const path = parseTypescript
      .statementLast<VariableDeclaration>(
        `const React = require('react');
         var foo: React.PropsWithRef<Props>`,
      )
      .get(
        'declarations.0.id.typeAnnotation.typeAnnotation',
      ) as NodePath<TSTypeReference>;

    expect(unwrapBuiltinTSPropTypes(path)).toMatchSnapshot();
  });

  test('with named import', () => {
    const path = parseTypescript
      .statementLast<VariableDeclaration>(
        `import { PropsWithRef } from 'react';
         var foo: PropsWithRef<Props>`,
      )
      .get(
        'declarations.0.id.typeAnnotation.typeAnnotation',
      ) as NodePath<TSTypeReference>;

    expect(unwrapBuiltinTSPropTypes(path)).toMatchSnapshot();
  });
});
