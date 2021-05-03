import { expression, statement } from '../../../tests/utils';
import isUnreachableFlowType from '../isUnreachableFlowType';

describe('isUnreachableFlowType', () => {
  it('considers Identifier as unreachable', () => {
    expect(isUnreachableFlowType(expression('foo'))).toBe(true);
  });

  it('considers ImportDeclaration as unreachable', () => {
    expect(isUnreachableFlowType(statement('import x from "";'))).toBe(true);
  });

  it('considers CallExpression as unreachable', () => {
    expect(isUnreachableFlowType(expression('foo()'))).toBe(true);
  });

  it('considers VariableDeclaration not as unreachable', () => {
    expect(isUnreachableFlowType(statement('const x = 1;'))).toBe(false);
  });
});
