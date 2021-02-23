import { expression } from '../../../tests/utils';
import getMembers from '../getMembers';

describe('getMembers', () => {
  it('finds all "members" "inside" a MemberExpression', () => {
    const members = getMembers(expression('foo.bar(123)(456)[baz][42]'));

    expect(members).toMatchSnapshot();
  });
});
