import { parse } from '../../../tests/utils';
import getPropertyValuePath from '../getPropertyValuePath.js';
import getClassMemberValuePath from '../getClassMemberValuePath.js';
import getMemberValuePath from '../getMemberValuePath.js';
import getMemberExpressionValuePath from '../getMemberExpressionValuePath.js';
import type {
  CallExpression,
  ClassDeclaration,
  ClassExpression,
  ObjectExpression,
  TaggedTemplateExpression,
} from '@babel/types';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../getPropertyValuePath.js');
vi.mock('../getClassMemberValuePath.js');
vi.mock('../getMemberExpressionValuePath.js');

// https://github.com/vitest-dev/vitest/issues/2381
describe.skip('getMemberValuePath', () => {
  test('handles ObjectExpressions', () => {
    const path = parse.expression<ObjectExpression>('{}');

    getMemberValuePath(path, 'foo');
    expect(getPropertyValuePath).toBeCalledWith(path, 'foo');
  });

  test('handles ClassDeclarations', () => {
    const path = parse.statement<ClassDeclaration>('class Foo {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  test('handles TaggedTemplateLiterals', () => {
    const path = parse.expression<TaggedTemplateExpression>('foo``');

    getMemberValuePath(path, 'foo');
    expect(getMemberExpressionValuePath).toBeCalledWith(path, 'foo');
  });

  test('handles ClassExpressions', () => {
    const path = parse.expression<ClassExpression>('class {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  test('handles CallExpressions', () => {
    const path = parse.expression<CallExpression>(
      'system({is: "button"}, "space")',
    );

    getMemberValuePath(path, 'foo');
    expect(getMemberExpressionValuePath).toBeCalledWith(path, 'foo');
  });

  describe('tries defaultProps synonyms', () => {
    test('with object', () => {
      const path = parse.expression<ObjectExpression>('{}');

      getMemberValuePath(path, 'defaultProps');
      expect(getPropertyValuePath).toBeCalledWith(path, 'defaultProps');
      expect(getPropertyValuePath).toBeCalledWith(path, 'getDefaultProps');
    });

    test('with class', () => {
      const path = parse.statement<ClassDeclaration>('class Foo {}');

      getMemberValuePath(path, 'defaultProps');
      expect(getClassMemberValuePath).toBeCalledWith(path, 'defaultProps');
      expect(getClassMemberValuePath).toBeCalledWith(path, 'getDefaultProps');
    });
  });

  test('returns the result of getPropertyValuePath and getClassMemberValuePath', () => {
    const mockPath = parse.expression('42');
    const mockPath2 = parse.expression('21');

    vi.mocked(getPropertyValuePath).mockReturnValue(mockPath);
    vi.mocked(getClassMemberValuePath).mockReturnValue(mockPath2);
    let path = parse.expression<ObjectExpression>('{}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(mockPath);

    path = parse.statement('class Foo {}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(mockPath2);
  });
});
