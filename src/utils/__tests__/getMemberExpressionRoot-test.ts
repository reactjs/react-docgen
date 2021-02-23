import { expression } from '../../../tests/utils';
import getMemberExpressionRoot from '../getMemberExpressionRoot';

describe('getMemberExpressionRoot', () => {
  it('returns the root of a member expression', () => {
    const root = getMemberExpressionRoot(expression('foo.bar.baz'));
    expect(root).toEqualASTNode(expression('foo'));
  });
});
