import { builders, NodePath } from 'ast-types';
import { parse } from '../../../tests/utils';
import printValue from '../printValue';

describe('printValue', () => {
  function pathFromSource(source) {
    return parse(source).get('body', 0, 'expression');
  }

  it('does not print leading comments', () => {
    expect(printValue(pathFromSource('//foo\nbar'))).toEqual('bar');
  });

  it('does not print trailing comments', () => {
    expect(printValue(pathFromSource('bar//foo'))).toEqual('bar');
  });

  it('handles arbitrary generated nodes', () => {
    expect(
      printValue(
        new NodePath(
          builders.arrayExpression([
            builders.literal('bar'),
            builders.literal('foo'),
            builders.literal(1),
            builders.literal(2),
            builders.literal(3),
            builders.literal(null),
            builders.memberExpression(
              builders.identifier('foo'),
              builders.identifier('bar'),
            ),
            builders.jsxElement(
              builders.jsxOpeningElement(
                builders.jsxIdentifier('Baz'),
                [],
                true,
              ),
            ),
          ]),
        ),
      ),
    ).toEqual('["bar", "foo", 1, 2, 3, null, foo.bar, <Baz />]');
  });
});
