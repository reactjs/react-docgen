import { parse } from '../../../tests/utils';
import componentMethodsHandler from '../componentMethodsHandler.js';
import DocumentationBuilder from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import type {
  ClassDeclaration,
  FunctionDeclaration,
  ObjectExpression,
} from '@babel/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../Documentation.js');

describe('componentMethodsHandler useImperativeHandle callbacks', () => {
  let documentation: DocumentationBuilder & DocumentationMock;

  beforeEach(() => {
    documentation = new DocumentationBuilder() as DocumentationBuilder &
      DocumentationMock;
  });

  const wrappedSignature = {
    name: 'method',
    params: [{ name: 'argument', optional: false, type: { name: 'string' } }],
    returns: { type: { name: 'number' } },
  };

  test.each([
    {
      name: 'a directly-declared callback',
      imports: "import { useCallback, useImperativeHandle } from 'react';",
      setup: '',
      value: 'useCallback((argument: string): number => 1, [])',
      imperativeHandle: 'useImperativeHandle',
    },
    {
      name: 'a callback identifier',
      imports: "import { useCallback, useImperativeHandle } from 'react';",
      setup: 'const callback = (argument: string): number => 1;',
      value: 'useCallback(callback, [])',
      imperativeHandle: 'useImperativeHandle',
    },
    {
      name: 'a React namespace callback',
      imports: "import * as React from 'react';",
      setup: '',
      value: 'React.useCallback((argument: string): number => 1, [])',
      imperativeHandle: 'React.useImperativeHandle',
    },
    {
      name: 'a renamed useCallback import',
      imports:
        "import { useCallback as useCb, useImperativeHandle } from 'react';",
      setup: '',
      value: 'useCb((argument: string): number => 1, [])',
      imperativeHandle: 'useImperativeHandle',
    },
  ])(
    'extracts a method wrapped with $name',
    ({ imports, setup, value, imperativeHandle }) => {
      const definition = parse.statementLast<FunctionDeclaration>(`
        ${imports}
        function Component() {
          ${setup}
          const method = ${value};
          ${imperativeHandle}(ref, () => ({ method }));
          return <div />;
        }
      `);

      componentMethodsHandler(documentation, definition);

      // The wrapped function's own signature is what gets documented, not
      // the useCallback call around it.
      expect(documentation.methods).toHaveLength(1);
      expect(documentation.methods[0]).toMatchObject(wrappedSignature);
    },
  );

  test('extracts a callback written inline in the handle object', () => {
    const definition = parse.statementLast<FunctionDeclaration>(`
      import { useCallback, useImperativeHandle } from 'react';
      function Component() {
        useImperativeHandle(ref, () => ({
          method: useCallback((argument: string): number => 1, []),
        }));
        return <div />;
      }
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(1);
    expect(documentation.methods[0]).toMatchObject(wrappedSignature);
  });

  test('extracts a callback declared after the imperative handle', () => {
    const definition = parse.statementLast<FunctionDeclaration>(`
      import { useCallback, useImperativeHandle } from 'react';
      function Component() {
        useImperativeHandle(ref, () => ({ method }));
        const method = useCallback((argument: string): number => 1, []);
        return <div />;
      }
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(1);
    expect(documentation.methods[0]).toMatchObject(wrappedSignature);
  });

  test('carries the docblock of the handle property', () => {
    const definition = parse.statementLast<FunctionDeclaration>(`
      import { useCallback, useImperativeHandle } from 'react';
      function Component() {
        const method = useCallback((argument: string): number => 1, []);
        useImperativeHandle(ref, () => ({
          /**
           * The method
           */
          method,
        }));
        return <div />;
      }
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(1);
    expect(documentation.methods[0]).toMatchObject({
      ...wrappedSignature,
      docblock: 'The method',
    });
  });

  test.each([
    {
      name: 'async',
      callback: 'async (argument: string): number => 1',
      modifiers: ['async'],
    },
    {
      name: 'generator',
      callback: 'function* (argument: string): number {}',
      modifiers: ['generator'],
    },
  ])(
    'records the $name modifier of the wrapped function',
    ({ callback, modifiers }) => {
      const definition = parse.statementLast<FunctionDeclaration>(`
        import { useCallback, useImperativeHandle } from 'react';
        function Component() {
          const method = useCallback(${callback}, []);
          useImperativeHandle(ref, () => ({ method }));
          return <div />;
        }
      `);

      componentMethodsHandler(documentation, definition);

      expect(documentation.methods).toHaveLength(1);
      expect(documentation.methods[0]).toMatchObject({
        name: 'method',
        modifiers,
      });
    },
  );

  test('extracts a zero-parameter callback with no return annotation', () => {
    const definition = parse.statementLast<FunctionDeclaration>(`
      import { useCallback, useImperativeHandle } from 'react';
      function Component() {
        const method = useCallback(() => {}, []);
        useImperativeHandle(ref, () => ({ method }));
        return <div />;
      }
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(1);
    expect(documentation.methods[0]).toMatchObject({
      name: 'method',
      params: [],
      returns: null,
    });
  });

  test('documents a plain function exposed through the handle (control)', () => {
    // Controls for the imperative handle surface itself: it documented plain
    // function values before this change, so the callback cases above fail on
    // the unwrapping, not on the handle.
    const definition = parse.statementLast<FunctionDeclaration>(`
      import { useImperativeHandle } from 'react';
      function Component() {
        const method = (argument: string): number => 1;
        useImperativeHandle(ref, () => ({ method }));
        return <div />;
      }
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(1);
    expect(documentation.methods[0]).toMatchObject(wrappedSignature);
  });

  // Hooks are only valid inside a function component, so the unwrapping stays
  // on the imperative handle path: these surfaces document plain functions and
  // keep ignoring useCallback calls.
  test('does not document a callback method on an ObjectExpression component (control)', () => {
    const definition = parse.expressionLast<ObjectExpression>(`
      import { useCallback } from 'react';
      ({
        method: useCallback((argument: string): number => 1, []),
      })
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(0);
  });

  test('does not document a callback method in a statics object (control)', () => {
    const definition = parse.expressionLast<ObjectExpression>(`
      import { useCallback } from 'react';
      ({
        statics: {
          method: useCallback((argument: string): number => 1, []),
        },
      })
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(0);
  });

  test('does not document a callback class property (control)', () => {
    const definition = parse.statementLast<ClassDeclaration>(`
      import React, { useCallback } from 'react';
      class Test extends React.Component {
        method = useCallback((argument: string): number => 1, []);
        render() { return null; }
      }
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(0);
  });

  test('documents a plain function class property (control)', () => {
    // Controls for the class-property surface: it still documents plain
    // function values, so the callback class property above is undocumented
    // because of the scoping and not because the surface stopped working.
    const definition = parse.statementLast<ClassDeclaration>(`
      import React from 'react';
      class Test extends React.Component {
        method = (argument: string): number => 1;
        render() { return null; }
      }
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(1);
    expect(documentation.methods[0]).toMatchObject(wrappedSignature);
  });

  // Each of these pins one guard the unwrapping must keep: they are already
  // undocumented before this change, and must stay undocumented after it.
  test.each([
    {
      // the call has to resolve to React's useCallback, not any binding of
      // that name
      name: 'a local function named useCallback (control)',
      imports: "import { useImperativeHandle } from 'react';",
      setup:
        'function useCallback(fn: unknown, deps: unknown[]) { return fn; }',
      value: 'useCallback((argument: string): number => 1, [])',
    },
    {
      // there has to be a first argument at all
      name: 'a useCallback call with no arguments (control)',
      imports: "import { useCallback, useImperativeHandle } from 'react';",
      setup: '',
      value: 'useCallback()',
    },
    {
      // the first argument has to resolve to a function
      name: 'a useCallback call whose first argument is not a function (control)',
      imports: "import { useCallback, useImperativeHandle } from 'react';",
      setup: '',
      value: 'useCallback(42, [])',
    },
    {
      // a spread element is not the callback, even when it spreads one
      name: 'a useCallback call whose argument is spread (control)',
      imports: "import { useCallback, useImperativeHandle } from 'react';",
      setup: 'const args = [(argument: string): number => 1, []];',
      value: 'useCallback(...args)',
    },
    {
      // the unwrapping is one level deep, not recursive
      name: 'a nested useCallback call (control)',
      imports: "import { useCallback, useImperativeHandle } from 'react';",
      setup: '',
      value:
        'useCallback(useCallback((argument: string): number => 1, []), [])',
    },
    {
      // only useCallback is unwrapped, not every React builtin that returns
      // a function
      name: 'a useMemo call returning a function (control)',
      imports: "import { useMemo, useImperativeHandle } from 'react';",
      setup: '',
      value: 'useMemo(() => (argument: string): number => 1, [])',
    },
  ])('does not document $name', ({ imports, setup, value }) => {
    const definition = parse.statementLast<FunctionDeclaration>(`
      ${imports}
      function Component() {
        ${setup}
        const method = ${value};
        useImperativeHandle(ref, () => ({ method }));
        return <div />;
      }
    `);

    expect(() =>
      componentMethodsHandler(documentation, definition),
    ).not.toThrow();
    expect(documentation.methods).toHaveLength(0);
  });
});
