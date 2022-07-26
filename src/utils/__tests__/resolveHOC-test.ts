import { identifier, numericLiteral } from '@babel/types';
import { makeMockImporter, parse } from '../../../tests/utils';
import resolveHOC from '../resolveHOC';

describe('resolveHOC', () => {
  const mockImporter = makeMockImporter({
    component: stmtLast =>
      stmtLast(`
      export default Component;
    `).get('declaration'),

    hoc: stmtLast =>
      stmtLast(`
      import foo from 'component';
      export default hoc1(foo);
    `).get('declaration'),
  });

  it('resolves simple hoc', () => {
    const path = parse.expressionLast(['hoc(Component);'].join('\n'));

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('resolves simple hoc w/ multiple args', () => {
    const path = parse.expressionLast(
      ['hoc1(arg1a, arg1b)(Component);'].join('\n'),
    );

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('resolves nested hocs', () => {
    const path = parse.expressionLast(
      `hoc2(arg2b, arg2b)(
        hoc1(arg1a, arg2a)(Component)
      );`,
    );

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('resolves really nested hocs', () => {
    const path = parse.expressionLast(
      `hoc3(arg3a, arg3b)(
        hoc2(arg2b, arg2b)(
          hoc1(arg1a, arg2a)(Component)
        )
      );`,
    );

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('resolves HOC with additional params', () => {
    const path = parse.expressionLast(`hoc3(Component, {})`);

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('resolves HOC as last element if first is literal', () => {
    const path = parse.expressionLast(`hoc3(41, Component)`);

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('resolves HOC as last element if first is array', () => {
    const path = parse.expressionLast(`hoc3([], Component)`);

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('resolves HOC as last element if first is object', () => {
    const path = parse.expressionLast(`hoc3({}, Component)`);

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('resolves HOC as last element if first is spread', () => {
    const path = parse.expressionLast(`hoc3(...params, Component)`);

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('resolves intermediate hocs', () => {
    const path = parse.expressionLast(
      ['const Component = React.memo(42);', 'hoc()(Component);'].join('\n'),
    );

    expect(resolveHOC(path)).toEqualASTNode(numericLiteral(42));
  });

  it('can resolve an imported component passed to hoc', () => {
    const path = parse.expressionLast(
      `
      import foo from 'component';
      hoc(foo);
    `,
      mockImporter,
    );

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('can resolve an imported component passed to nested hoc', () => {
    const path = parse.expressionLast(
      `
      import foo from 'component';
      hoc2(arg2b, arg2b)(
        hoc1(arg1a, arg2a)(foo)
      );
    `,
      mockImporter,
    );

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });

  it('can resolve an hocs inside imported component passed to hoc', () => {
    const path = parse.expressionLast(
      `import bar from 'hoc';
       hoc(bar);`,
      mockImporter,
    );

    expect(resolveHOC(path)).toEqualASTNode(identifier('Component'));
  });
});
