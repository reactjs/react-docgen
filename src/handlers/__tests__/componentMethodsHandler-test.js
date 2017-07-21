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

jest.disableAutomock();
jest.mock('../../Documentation');

describe('componentMethodsHandler', () => {
  let documentation;
  let componentMethodsHandler;
  let parse;

  beforeEach(() => {
    ({parse} = require('../../../tests/utils'));
    documentation = new (require('../../Documentation'));
    componentMethodsHandler = require('../componentMethodsHandler').default;
  });

  function test(definition) {
    componentMethodsHandler(documentation, definition);
    expect(documentation.methods).toEqual([
      {
        name: 'foo',
        docblock: 'The foo method',
        modifiers: [],
        returns: {
          type: {name: 'number'},
        },
        params: [{
          name: 'bar',
          type: {name: 'number'},
        }],
      },
      {
        name: 'baz',
        docblock: '"arrow function method"',
        modifiers: [],
        returns: {
          type: {name: 'string'},
        },
        params: [{
          name: 'foo',
          type: {name: 'string'},
        }],
      },
      {
        name: 'bar',
        docblock: 'Static function',
        modifiers: ['static'],
        returns: null,
        params: [],
      },
    ]);
  }

  it('extracts the documentation for an ObjectExpression', () => {
    const src = `
      ({
        /**
         * The foo method
         */
        foo(bar: number): number {
          return bar;
        },
        /**
         * "arrow function method"
         */
        baz: (foo: string): string => {},
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
         */
        foo(bar: number): number {
          return bar;
        }

        /**
         * "arrow function method"
         */
        baz = (foo: string): string => {};

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
