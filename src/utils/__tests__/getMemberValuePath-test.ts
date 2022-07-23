import { parse } from '../../../tests/utils';
import getPropertyValuePath from '../getPropertyValuePath';
import getClassMemberValuePath from '../getClassMemberValuePath';
import getMemberValuePath from '../getMemberValuePath';
import getMemberExpressionValuePath from '../getMemberExpressionValuePath';

jest.mock('../getPropertyValuePath');
jest.mock('../getClassMemberValuePath');
jest.mock('../getMemberExpressionValuePath');

describe('getMemberValuePath', () => {
  it('handles ObjectExpressions', () => {
    const path = parse.expression('{}');

    getMemberValuePath(path, 'foo');
    expect(getPropertyValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles ClassDeclarations', () => {
    const path = parse.statement('class Foo {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles TaggedTemplateLiterals', () => {
    const path = parse.expression('foo``');

    getMemberValuePath(path, 'foo');
    expect(getMemberExpressionValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles ClassExpressions', () => {
    const path = parse.expression('class {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles CallExpressions', () => {
    const path = parse.expression('system({is: "button"}, "space")');

    getMemberValuePath(path, 'foo');
    expect(getMemberExpressionValuePath).toBeCalledWith(path, 'foo');
  });

  describe('tries defaultProps synonyms', () => {
    it('with object', () => {
      const path = parse.expression('{}');

      getMemberValuePath(path, 'defaultProps');
      expect(getPropertyValuePath).toBeCalledWith(path, 'defaultProps');
      expect(getPropertyValuePath).toBeCalledWith(path, 'getDefaultProps');
    });

    it('with class', () => {
      const path = parse.statement('class Foo {}');

      getMemberValuePath(path, 'defaultProps');
      expect(getClassMemberValuePath).toBeCalledWith(path, 'defaultProps');
      expect(getClassMemberValuePath).toBeCalledWith(path, 'getDefaultProps');
    });
  });

  it('returns the result of getPropertyValuePath and getClassMemberValuePath', () => {
    const mockPath = parse.expression('42');
    const mockPath2 = parse.expression('21');
    jest.mocked(getPropertyValuePath).mockReturnValue(mockPath);
    jest.mocked(getClassMemberValuePath).mockReturnValue(mockPath2);
    let path = parse.expression('{}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(mockPath);

    path = parse.statement('class Foo {}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(mockPath2);
  });
});
