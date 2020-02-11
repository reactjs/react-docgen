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

    test(parse(src).get('body', 0));
  });

  it('should handle and ignore computed methods', () => {
    const src = `
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

    componentMethodsHandler(documentation, parse(src).get('body', 0));
    expect(documentation.methods).toMatchSnapshot();
  });

  describe('function components', () => {
    it('no methods', () => {
      const src = `
        (props) => {}
      `;

      const definition = parse(src).get('body', 0, 'expression');
      componentMethodsHandler(documentation, definition);
      expect(documentation.methods).toEqual([]);
    });

    it('finds static methods on a component in a variable declaration', () => {
      const src = `
        const Test = (props) => {};
        Test.doFoo = () => {};
        Test.doBar = () => {};
        Test.displayName = 'Test'; // Not a method
      `;

      const definition = parse(src).get('body', 0, 'declarations', 0, 'init');
      componentMethodsHandler(documentation, definition);
      expect(documentation.methods).toMatchSnapshot();
    });

    it('finds static methods on a component in an assignment', () => {
      const src = `
        Test = (props) => {};
        Test.doFoo = () => {};
        Test.doBar = () => {};
        Test.displayName = 'Test'; // Not a method
      `;

      const definition = parse(src).get('body', 0, 'expression', 'right');
      componentMethodsHandler(documentation, definition);
      expect(documentation.methods).toMatchSnapshot();
    });

    it('finds static methods on a function declaration', () => {
      const src = `
        function Test(props) {}
        Test.doFoo = () => {};
        Test.doBar = () => {};
        Test.displayName = 'Test'; // Not a method
      `;

      const definition = parse(src).get('body', 0);
      componentMethodsHandler(documentation, definition);
      expect(documentation.methods).toMatchSnapshot();
    });
  });
});
