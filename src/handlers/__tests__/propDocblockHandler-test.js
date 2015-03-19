/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

"use strict";

jest.autoMockOff();
jest.mock('../../Documentation');

describe('propDocBlockHandler', () => {
  var utils;
  var documentation;
  var propDocBlockHandler;

  beforeEach(() => {
    utils = require('../../../tests/utils');
    documentation = new (require('../../Documentation'));
    propDocBlockHandler = require('../propDocBlockHandler');
  });

  function parse(definition) {
    var programPath = utils.parse(definition);
    return programPath.get(
      'body',
      programPath.node.body.length - 1,
      'expression'
    );
  }

  it('finds docblocks for prop types', () => {
    var definition = parse([
      '({',
      '  propTypes: {',
      '    /**',
      '     * Foo comment',
      '     */',
      '    foo: Prop.bool,',
      '',
      '    /**',
      '     * Bar comment',
      '     */',
      '    bar: Prop.bool,',
      '  }',
      '})'
    ].join('\n'));

    propDocBlockHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      foo: {
        description: 'Foo comment'
      },
      bar: {
        description: 'Bar comment'
      }
    });
  });

  it('can handle multline comments', () => {
    var definition = parse([
      '({',
      '  propTypes: {',
      '    /**',
      '     * Foo comment with',
      '     * many lines!',
      '     *',
      '     * even with empty lines in between',
      '     */',
      '    foo: Prop.bool',
      '  }',
      '})'
    ].join('\n'));

    propDocBlockHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      foo: {
        description:
            'Foo comment with\nmany lines!\n\neven with empty lines in between'
      },
    });
  });

  it('ignores non-docblock comments', () => {
    var definition = parse([
      '({',
      '  propTypes: {',
      '    /**',
      '     * Foo comment',
      '     */',
      '    // TODO: remove this comment',
      '    foo: Prop.bool,',
      '',
      '    /**',
      '     * Bar comment',
      '     */',
      '    /* This is not a doc comment */',
      '    bar: Prop.bool,',
      '  }',
      '})'
    ].join('\n'));

    propDocBlockHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      foo: {
        description: 'Foo comment'
      },
      bar: {
        description: 'Bar comment'
      }
    });
  });

  it('only considers the comment with the property below it', () => {
    var definition = parse([
      '({',
      '  propTypes: {',
      '    /**',
      '     * Foo comment',
      '     */',
      '    foo: Prop.bool,',
      '    bar: Prop.bool,',
      '  }',
      '})'
    ].join('\n'));

    propDocBlockHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      foo: {
        description: 'Foo comment'
      },
      bar: {
        description: ''
      }
    });
  });

  it('understands and ignores the spread operator', () => {
    var definition = parse([
      '({',
      '  propTypes: {',
      '    ...Foo.propTypes,',
      '    /**',
      '     * Foo comment',
      '     */',
      '    foo: Prop.bool,',
      '  }',
      '})'
    ].join('\n'));

    propDocBlockHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      foo: {
        description: 'Foo comment'
      }
    });
  });

  it('resolves variables', () => {
    var definition = parse([
      'var Props = {',
      '  /**',
      '   * Foo comment',
      '   */',
      '  foo: Prop.bool,',
      '};',
      '({',
      '  propTypes: Props',
      '})'
    ].join('\n'));

    propDocBlockHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
      foo: {
        description: 'Foo comment'
      }
    });
  });

  it('does not error if propTypes cannot be found', () => {
    var definition = parse([
      '({',
      '  fooBar: 42',
      '})',
    ].join('\n'));

    expect(function() {
      propDocBlockHandler(documentation, definition);
    }).not.toThrow();
  });
});
