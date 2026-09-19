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

  test('extracts a method wrapped with useCallback', () => {
    const definition = parse.statementLast<FunctionDeclaration>(`
      import { useCallback, useImperativeHandle } from 'react';
      function Component() {
        const method = useCallback((argument: string): number => 1, []);
        useImperativeHandle(ref, () => ({ method }));
        return <div />;
      }
    `);

    componentMethodsHandler(documentation, definition);

    expect(documentation.methods).toHaveLength(1);
    expect(documentation.methods[0]?.name).toBe('method');
  });
});
