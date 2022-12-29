import ChainResolver from '../ChainResolver.js';
import { describe, expect, test, vi } from 'vitest';
import FileStateMock from '../../__mocks__/FileState';
import { blockStatement, functionExpression } from '@babel/types';

describe('ChainResolver', () => {
  const fileStateMock = new FileStateMock();
  const component1 = functionExpression(null, [], blockStatement([]));
  const component2 = functionExpression(null, [], blockStatement([]));

  test('can be used with only one resolver', () => {
    const resolver = vi.fn().mockReturnValue([]);
    const chainResolver = new ChainResolver([resolver], {
      chainingLogic: ChainResolver.Logic.ALL,
    });

    chainResolver.resolve(fileStateMock);

    expect(resolver).toHaveBeenCalledOnce();
    expect(resolver).toHaveBeenCalledWith(fileStateMock);
  });

  test('can be used with multiple resolvers', () => {
    const resolver1 = vi.fn().mockReturnValue([]);
    const resolver2 = vi.fn().mockReturnValue([]);
    const chainResolver = new ChainResolver([resolver1, resolver2], {
      chainingLogic: ChainResolver.Logic.ALL,
    });

    chainResolver.resolve(fileStateMock);

    expect(resolver1).toHaveBeenCalledOnce();
    expect(resolver1).toHaveBeenCalledWith(fileStateMock);
    expect(resolver2).toHaveBeenCalledOnce();
    expect(resolver2).toHaveBeenCalledWith(fileStateMock);
  });

  test('returns all components from all resolvers with ALL logic', () => {
    const resolver1 = vi.fn().mockReturnValue([component1]);
    const resolver2 = vi.fn().mockReturnValue([component2]);
    const chainResolver = new ChainResolver([resolver1, resolver2], {
      chainingLogic: ChainResolver.Logic.ALL,
    });

    const result = chainResolver.resolve(fileStateMock);

    expect(result).toEqual([component1, component2]);
  });

  test('returns no duplicates with ALL logic', () => {
    const resolver1 = vi.fn().mockReturnValue([component1]);
    const resolver2 = vi.fn().mockReturnValue([component1, component2]);
    const chainResolver = new ChainResolver([resolver1, resolver2], {
      chainingLogic: ChainResolver.Logic.ALL,
    });

    const result = chainResolver.resolve(fileStateMock);

    expect(result).toEqual([component1, component2]);
  });

  test('returns first found components with FIRST_FOUND logic', () => {
    const resolver1 = vi.fn().mockReturnValue([component1]);
    const resolver2 = vi.fn().mockReturnValue([component2]);
    const chainResolver = new ChainResolver([resolver1, resolver2], {
      chainingLogic: ChainResolver.Logic.FIRST_FOUND,
    });

    const result = chainResolver.resolve(fileStateMock);

    expect(result).toEqual([component1]);
  });

  test('returns empty array if no components found with ALL logic', () => {
    const resolver1 = vi.fn().mockReturnValue([]);
    const resolver2 = vi.fn().mockReturnValue([]);
    const chainResolver = new ChainResolver([resolver1, resolver2], {
      chainingLogic: ChainResolver.Logic.ALL,
    });

    const result = chainResolver.resolve(fileStateMock);

    expect(result).toEqual([]);
  });

  test('returns empty array if no components found with FIRST_FOUND logic', () => {
    const resolver1 = vi.fn().mockReturnValue([]);
    const resolver2 = vi.fn().mockReturnValue([]);
    const chainResolver = new ChainResolver([resolver1, resolver2], {
      chainingLogic: ChainResolver.Logic.FIRST_FOUND,
    });

    const result = chainResolver.resolve(fileStateMock);

    expect(result).toEqual([]);
  });

  test('throws if resolver throws', () => {
    const error = new Error('test');
    const resolver = vi.fn().mockImplementation(() => {
      throw error;
    });
    const chainResolver = new ChainResolver([resolver], {
      chainingLogic: ChainResolver.Logic.ALL,
    });

    expect(() => chainResolver.resolve(fileStateMock)).toThrowError(error);
  });
});
