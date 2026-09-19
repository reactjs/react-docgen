import { parse } from '../../../tests/utils';
import componentMethodsHandler from '../componentMethodsHandler.js';
import DocumentationBuilder from '../../Documentation';
import type DocumentationMock from '../../__mocks__/Documentation';
import type { FunctionDeclaration } from '@babel/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../Documentation.js');

describe('componentMethodsHandler useImperativeHandle callbacks', () => {
  let documentation: DocumentationBuilder & DocumentationMock;

  beforeEach(() => {
    documentation = new DocumentationBuilder() as DocumentationBuilder &
      DocumentationMock;
  });

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
      expect(documentation.methods[0]).toMatchObject({
        name: 'method',
        params: [
          { name: 'argument', optional: false, type: { name: 'string' } },
        ],
        returns: { type: { name: 'number' } },
      });
    },
  );

  test.each([
    {
      name: 'a local function named useCallback',
      imports: "import { useImperativeHandle } from 'react';",
      setup:
        'function useCallback(fn: unknown, deps: unknown[]) { return fn; }',
      value: 'useCallback((argument: string): number => 1, [])',
    },
    {
      name: 'a useCallback call with no arguments',
      imports: "import { useCallback, useImperativeHandle } from 'react';",
      setup: '',
      value: 'useCallback()',
    },
    {
      name: 'a useCallback call whose first argument is not a function',
      imports: "import { useCallback, useImperativeHandle } from 'react';",
      setup: '',
      value: 'useCallback(42, [])',
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
