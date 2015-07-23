/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.autoMockOff();
jest.mock('../../Documentation');

describe('componentDocblockHandler', () => {
  var parse;
  var documentation;
  var componentDocblockHandler;

  function lastStatement(src) {
    var programPath = parse(src);
    return programPath.get(
      'body',
      programPath.node.body.length - 1
    );
  }

  beforeEach(() => {
    ({parse} = require('../../../tests/utils'));
    documentation = new (require('../../Documentation'));
    componentDocblockHandler = require('../componentDocblockHandler');
  });

  function test(definitionSrc, parse) { // eslint-disable-line no-shadow
    it('finds docblocks for component definitions', () => {
      var definition = parse(`
        /**
         * Component description
         */
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition);
      expect(documentation.description).toBe('Component description');
    });

    it('ignores other types of comments', () => {
      var definition = parse(`
        /*
         * This is not a docblock',
         */
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition);
      expect(documentation.description).toBe('');

      definition = parse(`
        // Inline comment'
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition);
      expect(documentation.description).toBe('');
    });

    it('only considers the docblock directly above the definition', () => {
      var definition = parse(`
        /**
         * This is the wrong docblock
         */
        var something_else = "foo";
        ${definitionSrc}
      `);

      componentDocblockHandler(documentation, definition);
      expect(documentation.description).toBe('');
    });
  }

  describe('React.createClass', () => {
    test(
      'var Component = React.createClass({})',
      src => lastStatement(src).get('declarations', 0, 'init', 'arguments', 0)
    );
  });

  describe('ClassDeclaration', () => {
    test(
      'class Component {}',
      src => lastStatement(src)
    );
  });

  describe('ClassExpression', () => {
    test(
      'var Compoent = class {};',
      src => lastStatement(src).get('declarations', 0, 'init')
    );
  });
});
