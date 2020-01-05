/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { statement } from '../../../tests/utils';
import getMethodDocumentation from '../getMethodDocumentation';

describe('getMethodDocumentation', () => {
  describe('name', () => {
    it('extracts the method name', () => {
      const def = statement(`
        class Foo {
          hello() {}
        }
      `);
      const method = def.get('body', 'body', 0);
      expect(getMethodDocumentation(method)).toEqual({
        name: 'hello',
        docblock: null,
        modifiers: [],
        returns: null,
        params: [],
      });
    });

    it('handles computed method name', () => {
      const def = statement(`
        class Foo {
          [foo]() {}
        }
      `);
      const method = def.get('body', 'body', 0);
      expect(getMethodDocumentation(method)).toMatchSnapshot();
    });

    it('ignores complex computed method name', () => {
      const def = statement(`
        class Foo {
          [() => {}]() {}
        }
      `);
      const method = def.get('body', 'body', 0);
      expect(getMethodDocumentation(method)).toMatchSnapshot();
    });
  });

  describe('docblock', () => {
    it('extracts the method docblock', () => {
      const def = statement(`
        class Foo {
          /**
           * Don't use this!
           */
          foo() {}
        }
      `);
      const method = def.get('body', 'body', 0);
      expect(getMethodDocumentation(method)).toEqual({
        name: 'foo',
        docblock: "Don't use this!",
        modifiers: [],
        returns: null,
        params: [],
      });
    });
  });

  describe('parameters', () => {
    function methodParametersDoc(params) {
      return {
        name: 'foo',
        docblock: null,
        modifiers: [],
        returns: null,
        params,
      };
    }

    it('extracts flow type info', () => {
      const def = statement(`
        class Foo {
          foo(bar: number) {}
        }
      `);
      const method = def.get('body', 'body', 0);
      expect(getMethodDocumentation(method)).toEqual(
        methodParametersDoc([
          {
            name: 'bar',
            type: { name: 'number' },
          },
        ]),
      );
    });

    describe('modifiers', () => {
      function methodModifiersDoc(modifiers) {
        return {
          name: 'foo',
          docblock: null,
          modifiers,
          returns: null,
          params: [],
        };
      }

      it('detects no modifiers', () => {
        const def = statement(`
          class Foo {
            foo() {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(methodModifiersDoc([]));
      });

      it('detects static functions', () => {
        const def = statement(`
          class Foo {
            static foo() {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc(['static']),
        );
      });

      it('detects generators', () => {
        const def = statement(`
          class Foo {
            *foo () {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc(['generator']),
        );
      });

      it('detects async functions', () => {
        const def = statement(`
          class Foo {
            async foo () {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc(['async']),
        );
      });

      it('detects static async functions', () => {
        const def = statement(`
          class Foo {
            static async foo () {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc(['static', 'async']),
        );
      });
    });

    describe('returns', () => {
      function methodReturnDoc(returnValue) {
        return {
          name: 'foo',
          docblock: null,
          modifiers: [],
          returns: returnValue,
          params: [],
        };
      }

      it('returns null if return is not documented', () => {
        const def = statement(`
          class Foo {
            foo () {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(methodReturnDoc(null));
      });

      it('extracts flow types', () => {
        const def = statement(`
          class Foo {
            foo (): number {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodReturnDoc({
            type: { name: 'number' },
          }),
        );
      });
    });

    describe('private', () => {
      it('ignores private typescript methods', () => {
        const def = statement(
          `
          class Foo {
            private foo() {}
          }
        `,
          { parserOptions: { plugins: ['typescript'] } },
        );
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toMatchSnapshot();
      });

      it.skip('ignores private methods', () => {
        const def = statement(
          `
          class Foo {
            #foo() {}
          }
        `,
          { parserOptions: { plugins: ['classPrivateMethods'] } },
        );
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toMatchSnapshot();
      });
    });
  });
});
