import { parse } from '../../../tests/utils';
import getMembers from '../getMembers';

describe('getMembers', () => {
  it('finds all "members" "inside" a MemberExpression', () => {
    const members = getMembers(parse.expression('foo.bar(123)(456)[baz][42]'));

    expect(members).toMatchSnapshot();
  });

  it('includes the root if option set to true', () => {
    const members = getMembers(parse.expression('foo.bar(123)[baz]'), true);

    expect(members).toMatchSnapshot();
  });

  it('does work with custom expressions in chain', () => {
    const members = getMembers(parse.expression('foo.bar(123)["" + ""]'));

    expect(members).toMatchSnapshot();
  });

  it('does work with custom expressions in arguments', () => {
    const members = getMembers(parse.expression('foo.bar(123 + 123)["baz"]'));

    expect(members).toMatchSnapshot();
  });
});
