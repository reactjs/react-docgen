/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, it, expect, beforeEach, afterEach*/

"use strict";

jest.autoMockOff();
jest.mock('../../Documentation');

describe('propTypeCompositionHandler', () => {
  var utils;
  var getPropTypeMock;
  var documentation;
  var propTypeCompositionHandler;

  beforeEach(() => {
    utils = require('../../../tests/utils');
    getPropTypeMock = jest.genMockFunction().mockImplementation(() => ({}));
    jest.setMock('../../utils/getPropType', getPropTypeMock);
    jest.mock('../../utils/getPropType');

    documentation = new (require('../../Documentation'))();
    propTypeCompositionHandler = require('../propTypeCompositionHandler');
  });

  function parse(definition) {
    var programPath = utils.parseWithTemplate(definition, utils.REACT_TEMPLATE);
    return programPath.get(
      'body',
      programPath.node.body.length - 1,
      'expression'
    );
  }

  it('understands assignment from module', () => {
    var definition = parse([
      'var Foo = require("Foo.react");',
      '({',
      '  propTypes: Foo.propTypes',
      '})',
    ].join('\n'));

    propTypeCompositionHandler(documentation, definition);
    expect(documentation.composes).toEqual(['Foo.react']);

    documentation.composes.length = 0;
    definition = parse([
      'var SharedProps = require("SharedProps");',
      '({',
      '  propTypes: SharedProps',
      '})',
    ].join('\n'));

    propTypeCompositionHandler(documentation, definition);
    expect(documentation.composes).toEqual(['SharedProps']);
  });

  it('understands the spread operator', () => {
    var definition = parse([
      'var Foo = require("Foo.react");',
      'var SharedProps = require("SharedProps");',
      '({',
      '  propTypes: {',
      '    ...Foo.propTypes,',
      '    ...SharedProps',
      '  }',
      '})',
    ].join('\n'));

    propTypeCompositionHandler(documentation, definition);
    expect(documentation.composes).toEqual(['Foo.react', 'SharedProps']);
  });

  it('does not error if propTypes cannot be found', () => {
    var definition = parse([
      '({',
      '  fooBar: 42',
      '})',
    ].join('\n'));

    expect(function() {
      propTypeCompositionHandler(documentation, definition);
    }).not.toThrow();
  });
});
