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

      expect(documentation.methods).toHaveLength(1);
      expect(documentation.methods[0]?.name).toBe('method');
    },
  );
});
