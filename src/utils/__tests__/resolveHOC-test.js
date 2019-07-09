/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import types from 'ast-types';
import resolveHOC from '../resolveHOC';
import * as utils from '../../../tests/utils';

const { builders } = types;

describe('resolveHOC', () => {
  function parse(src) {
    const root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  it('resolves simple hoc', () => {
    const path = parse(['hoc(42);'].join('\n'));
    expect(resolveHOC(path)).toEqualASTNode(builders.literal(42));
  });

  it('resolves simple hoc w/ multiple args', () => {
    const path = parse(['hoc1(arg1a, arg1b)(42);'].join('\n'));
    expect(resolveHOC(path)).toEqualASTNode(builders.literal(42));
  });

  it('resolves nested hocs', () => {
    const path = parse(
      ['hoc2(arg2b, arg2b)(', '  hoc1(arg1a, arg2a)(42)', ');'].join('\n'),
    );
    expect(resolveHOC(path)).toEqualASTNode(builders.literal(42));
  });

  it('resolves really nested hocs', () => {
    const path = parse(
      [
        'hoc3(arg3a, arg3b)(',
        '  hoc2(arg2b, arg2b)(',
        '    hoc1(arg1a, arg2a)(42)',
        '  )',
        ');',
      ].join('\n'),
    );
    expect(resolveHOC(path)).toEqualASTNode(builders.literal(42));
  });

  it('resolves intermediate hocs', () => {
    const path = parse(
      ['const Component = React.memo(42);', 'hoc()(Component);'].join('\n'),
    );
    expect(resolveHOC(path)).toEqualASTNode(builders.literal(42));
  });
});
