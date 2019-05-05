/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('../../Documentation');

import { parse } from '../../../tests/utils';

describe('componentMethodsHandler', () => {
  let documentation;
  let componentMethodsHandler;

  beforeEach(() => {
    documentation = new (require('../../Documentation'))();
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
          type: { name: 'number' },
        },
        params: [
          {
            name: 'bar',
            type: { name: 'number' },
          },
        ],
      },
      {
        name: 'baz',
        docblock: '"arrow function method"',
        modifiers: [],
        returns: {
          type: { name: 'string' },
        },
        params: [
          {
            name: 'foo',
            type: { name: 'string' },
          },
        ],
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
      import React from 'react';
      class Test extends React.Component {
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

    test(parse(src).get('body', 1));
  });

  it('should handle and ignore computed methods', () => {
    const src = `
      import React from 'react';
      class Test extends React.Component {
        /**
         * The foo method
         */
        [foo](bar: number): number {
          return bar;
        }

        /**
         * Should not show up
         */
        [() => {}](bar: number): number {
          return bar;
        }

        componentDidMount() {}

        render() {
          return null;
        }
      }
    `;

    componentMethodsHandler(documentation, parse(src).get('body', 1));
    expect(documentation.methods).toMatchSnapshot();
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
