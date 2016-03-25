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

describe('componentMethodsHandler', () => {
  let documentation;
  let componentMethodsHandler;
  let parse;

  beforeEach(() => {
    ({parse} = require('../../../tests/utils'));
    documentation = new (require('../../Documentation'));
    componentMethodsHandler = require('../componentMethodsHandler');
  });

  function test(definition) {
    componentMethodsHandler(documentation, definition);
    expect(documentation.methods).toEqual([{
      name: 'foo',
      description: 'The foo method',
      visibility: 'protected',
      modifiers: [],
      return: {
        description: 'The number',
        type: {name: 'number'},
      },
      params: [{
        name: 'bar',
        description: 'The bar param',
        type: {name: 'number'},
      }],
    }, {
      name: 'bar',
      description: 'Static function',
      visibility: 'public',
      modifiers: ['static'],
      return: null,
      params: [],
    }]);
  }

  it('extracts the documentation for an ObjectExpression', () => {
    const src = `
      ({
        /**
         * The foo method
         * @protected
         * @param bar The bar param
         * @returns The number
         */
        foo(bar: number): number {
          return bar;
        },
        statics: {
          /**
           * Static function
           */
          bar() {}
        },
        state: {
          foo: 'foo',
        },
        componentDidMount() {},
        render() {
          return null;
        },
      })
    `;

    test(parse(src).get('body', 0, 'expression'));
  });

  it('extracts the documentation for a ClassDeclaration', () => {
    const src = `
      class Test {
        /**
         * The foo method
         * @protected
         * @param bar The bar param
         * @returns The number
         */
        foo(bar: number): number {
          return bar;
        }

        /**
         * Static function
         */
        static bar() {}

        state = {
          foo: 'foo',
        };

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    test(parse(src).get('body', 0));
  });

  it('should not find methods for stateless components', () => {
    const src = `
      (props) => {}
    `;

    const definition = parse(src).get('body', 0, 'expression');
    componentMethodsHandler(documentation, definition);
    expect(documentation.methods).toEqual([]);
  });
});
