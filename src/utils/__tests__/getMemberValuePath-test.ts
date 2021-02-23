import { expression, statement, noopImporter } from '../../../tests/utils';
import getPropertyValuePath from '../getPropertyValuePath';
import getClassMemberValuePath from '../getClassMemberValuePath';
import getMemberValuePath from '../getMemberValuePath';
import getMemberExpressionValuePath from '../getMemberExpressionValuePath';
import { mocked } from 'ts-jest/utils';
import { NodePath } from 'ast-types';

jest.mock('../getPropertyValuePath');
jest.mock('../getClassMemberValuePath');
jest.mock('../getMemberExpressionValuePath');

describe('getMemberValuePath', () => {
  it('handles ObjectExpressions', () => {
    const path = expression('{}');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getPropertyValuePath).toBeCalledWith(path, 'foo', noopImporter);
  });

  it('handles ClassDeclarations', () => {
    const path = statement('class Foo {}');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo', noopImporter);
  });

  it('handles TaggedTemplateLiterals', () => {
    const path = expression('foo``');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getMemberExpressionValuePath).toBeCalledWith(
      path,
      'foo',
      noopImporter,
    );
  });

  it('handles ClassExpressions', () => {
    const path = expression('class {}');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo', noopImporter);
  });

  it('handles CallExpressions', () => {
    const path = expression('system({is: "button"}, "space")');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getMemberExpressionValuePath).toBeCalledWith(
      path,
      'foo',
      noopImporter,
    );
  });

  it('tries synonyms', () => {
    let path = expression('{}');

    getMemberValuePath(path, 'defaultProps', noopImporter);
    expect(getPropertyValuePath).toBeCalledWith(
      path,
      'defaultProps',
      noopImporter,
    );
    expect(getPropertyValuePath).toBeCalledWith(
      path,
      'getDefaultProps',
      noopImporter,
    );

    path = statement('class Foo {}');

    getMemberValuePath(path, 'defaultProps', noopImporter);
    expect(getClassMemberValuePath).toBeCalledWith(
      path,
      'defaultProps',
      noopImporter,
    );
    expect(getClassMemberValuePath).toBeCalledWith(
      path,
      'getDefaultProps',
      noopImporter,
    );
  });

  it('returns the result of getPropertyValuePath and getClassMemberValuePath', () => {
    const mockPath = new NodePath(42);
    const mockPath2 = new NodePath(21);
    mocked(getPropertyValuePath).mockReturnValue(mockPath);
    mocked(getClassMemberValuePath).mockReturnValue(mockPath2);
    let path = expression('{}');

    expect(getMemberValuePath(path, 'defaultProps', noopImporter)).toBe(
      mockPath,
    );

    path = statement('class Foo {}');

    expect(getMemberValuePath(path, 'defaultProps', noopImporter)).toBe(
      mockPath2,
    );
  });
});
