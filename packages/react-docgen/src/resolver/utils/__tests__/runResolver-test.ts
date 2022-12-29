import { describe, expect, test, vi } from 'vitest';
import type {
  ComponentNodePath,
  ResolverClass,
} from '../../../resolver/index.js';
import runResolver from '../runResolver';
import FileStateMock from '../../../__mocks__/FileState.js';

const createEmptyClassResolver = (path?: ComponentNodePath) =>
  new (class implements ResolverClass {
    resolve = vi.fn(() => {
      return path ? [path] : [];
    });
  })();

const createEmptyFunctionResolver = (path?: ComponentNodePath) =>
  vi.fn(() => (path ? [path] : []));

describe('runResolver', () => {
  const fileStateMock = new FileStateMock();

  test('does run function resolvers', () => {
    const resolver = createEmptyFunctionResolver();

    runResolver(resolver, fileStateMock);

    expect(resolver).toBeCalled();
    expect(resolver).toHaveBeenCalledWith(fileStateMock);
  });

  test('does run class resolvers', () => {
    const resolver = createEmptyClassResolver();

    runResolver(resolver, fileStateMock);

    expect(resolver.resolve).toBeCalled();
    expect(resolver.resolve).toHaveBeenCalledWith(fileStateMock);
  });
});
