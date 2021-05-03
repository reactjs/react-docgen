import { expression } from '../../../tests/utils';
import getParameterName from '../getParameterName';

describe('getParameterName', () => {
  it('returns the name for a normal parameter', () => {
    const def = expression('function(a) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('a');
  });

  it('returns the name for a rest parameter', () => {
    const def = expression('function(...a) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('...a');
  });

  it('returns the name for a parameter with a default value', () => {
    const def = expression('function(a = 0) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('a');
  });

  it('returns the raw representation for a parameter with object destructuring', () => {
    const def = expression('function({a}) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('{a}');
  });

  it('returns the raw representation for a parameter with array destructuring', () => {
    const def = expression('function([a]) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('[a]');
  });

  it('throws when passed an invalid path', () => {
    const def = expression('function() {}');
    const param = def;
    expect(() => getParameterName(param)).toThrow();
  });
});
