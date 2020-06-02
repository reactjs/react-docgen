/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('../../Documentation');

import { parse, parseWithTemplate } from '../../../tests/utils';

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

  describe('useImperativeHandle() methods', () => {
    // We're not worried about doc-blocks here, simply about finding method(s)
    // defined via the useImperativeHandle() hook.
    const IMPERATIVE_TEMPLATE = [
      'import React, { useImperativeHandle } from "react";',
      '%s',
    ].join('\n');

    // To simplify the variations, each one ends up with the following in the
    // parsed body:
    //
    // [0]: the react import
    // [1]: the initial definition/declaration
    // [2]: a React.forwardRef wrapper (or nothing)
    //
    // Note that in the cases where the React.forwardRef is used "inline" with
    // the definition/declaration, there is no [2], and it will be skipped.

    function testImperative(src) {
      const parsed = parseWithTemplate(src, IMPERATIVE_TEMPLATE);
      [1, 2].forEach(index => {
        // reset the documentation, since we may test more than once!
        documentation = new (require('../../Documentation'))();
        const definition = parsed.get('body', index);
        if (!definition.value) {
          return;
        }
        componentMethodsHandler(documentation, definition);
        expect(documentation.methods).toEqual([
          {
            docblock: null,
            modifiers: [],
            name: 'doFoo',
            params: [],
            returns: null,
          },
        ]);
      });
    }

    it('finds inside a component in a variable declaration', () => {
      testImperative(`
      const Test = (props, ref) => {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      };
      React.forwardRef(Test);
      `);
    });

    it('finds inside a component in an assignment', () => {
      testImperative(`
      Test = (props, ref) => {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      };
      `);
    });

    it('finds inside a function declaration', () => {
      testImperative(`
      function Test(props, ref) {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      }
      React.forwardRef(Test);
      `);
    });

    it('finds inside an inlined React.forwardRef call with arrow function', () => {
      testImperative(`
      React.forwardRef((props, ref) => {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      });
      `);
    });

    it('finds inside an inlined React.forwardRef call with plain function', () => {
      testImperative(`
      React.forwardRef(function(props, ref) {
        useImperativeHandle(ref, () => ({
          doFoo: ()=>{},
        }));
      });
      `);
    });
  });
});
