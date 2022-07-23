import { parse } from '../../../tests/utils';
import getNameOrValue from '../getNameOrValue';

describe('getNameOrValue', () => {
  it('gets Identifier name', () => {
    expect(getNameOrValue(parse.expression('foo'))).toMatchSnapshot();
  });

  it('gets string literal value', () => {
    expect(getNameOrValue(parse.expression('"foo"'))).toMatchSnapshot();
  });

  it('gets numeric literal value', () => {
    expect(getNameOrValue(parse.expression('1'))).toMatchSnapshot();
  });

  it('gets boolean literal value', () => {
    expect(getNameOrValue(parse.expression('true'))).toMatchSnapshot();
  });

  it('gets null RegExp pattern', () => {
    expect(getNameOrValue(parse.expression('/abc?/'))).toMatchSnapshot();
  });

  it('gets null literal value', () => {
    expect(getNameOrValue(parse.expression('null'))).toMatchSnapshot();
  });
});
