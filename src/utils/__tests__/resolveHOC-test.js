/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { builders } from 'ast-types';
import * as utils from '../../../tests/utils';
import resolveHOC from '../resolveHOC';

describe('resolveHOC', () => {
  function parse(src) {
    const root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  it('resolves simple hoc', () => {
    const path = parse(['hoc(Component);'].join('\n'));
    expect(resolveHOC(path)).toEqualASTNode(builders.identifier('Component'));
  });

  it('resolves simple hoc w/ multiple args', () => {
    const path = parse(['hoc1(arg1a, arg1b)(Component);'].join('\n'));
    expect(resolveHOC(path)).toEqualASTNode(builders.identifier('Component'));
  });

  it('resolves nested hocs', () => {
    const path = parse(
      `hoc2(arg2b, arg2b)(
        hoc1(arg1a, arg2a)(Component)
      );`,
    );
    expect(resolveHOC(path)).toEqualASTNode(builders.identifier('Component'));
  });

  it('resolves really nested hocs', () => {
    const path = parse(
      `hoc3(arg3a, arg3b)(
        hoc2(arg2b, arg2b)(
          hoc1(arg1a, arg2a)(Component)
        )
      );`,
    );
    expect(resolveHOC(path)).toEqualASTNode(builders.identifier('Component'));
  });

  it('resolves HOC with additional params', () => {
    const path = parse(`hoc3(Component, {})`);
    expect(resolveHOC(path)).toEqualASTNode(builders.identifier('Component'));
  });

  it('resolves HOC as last element if first is literal', () => {
    const path = parse(`hoc3(41, Component)`);
    expect(resolveHOC(path)).toEqualASTNode(builders.identifier('Component'));
  });

  it('resolves HOC as last element if first is array', () => {
    const path = parse(`hoc3([], Component)`);
    expect(resolveHOC(path)).toEqualASTNode(builders.identifier('Component'));
  });

  it('resolves HOC as last element if first is object', () => {
    const path = parse(`hoc3({}, Component)`);
    expect(resolveHOC(path)).toEqualASTNode(builders.identifier('Component'));
  });

  it('resolves HOC as last element if first is spread', () => {
    const path = parse(`hoc3(...params, Component)`);
    expect(resolveHOC(path)).toEqualASTNode(builders.identifier('Component'));
  });

  it('resolves intermediate hocs', () => {
    const path = parse(
      ['const Component = React.memo(42);', 'hoc()(Component);'].join('\n'),
    );
    expect(resolveHOC(path)).toEqualASTNode(builders.literal(42));
  });
});
