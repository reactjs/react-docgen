/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.autoMockOff();

describe('getMethodDocumentation', () => {
  let getMethodDocumentation;
  let expression, statement;

  beforeEach(() => {
    getMethodDocumentation = require('../getMethodDocumentation');
    ({expression, statement} = require('../../../tests/utils'));
  });

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
        description: null,
        visibility: 'public',
        modifiers: [],
        return: null,
        params: [],
      });
    });
  });

  describe('description', () => {
    it('extracts the method description in jsdoc', () => {
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
        description: 'Don\'t use this!',
        visibility: 'public',
        modifiers: [],
        return: null,
        params: [],
      });
    });
  });

  describe('parameters', () => {

    function methodParametersDoc(params) {
      return {
        name: 'foo',
        description: null,
        visibility: 'public',
        modifiers: [],
        return: null,
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
        methodParametersDoc([{
          name: 'bar',
          description: null,
          type: {name: 'number'},
        }])
      );
    });

    it('extracts jsdoc description', () => {
      const def = statement(`
        class Foo {
          /**
           * @param bar test
           */
          foo(bar) {}
        }
      `);
      const method = def.get('body', 'body', 0);
      expect(getMethodDocumentation(method)).toEqual(
        methodParametersDoc([{
          name: 'bar',
          description: 'test',
          type: null,
        }])
      );
    });

    it('works with complex parameters', () => {
      const def = statement(`
        class Foo {
          /**
           * @param bar test
           * @param hello bar
           * @param test hello
           */
          foo(bar: number, test: boolean, hello) {}
        }
      `);
      const method = def.get('body', 'body', 0);
      expect(getMethodDocumentation(method)).toEqual(
        methodParametersDoc([{
          name: 'bar',
          description: 'test',
          type: {name: 'number'},
        }, {
          name: 'test',
          description: 'hello',
          type: {name: 'boolean'},
        }, {
          name: 'hello',
          description: 'bar',
          type: null,
        }])
      );
    });

    describe('visibility', () => {

      function methodVisibilityDoc(visibility) {
        return {
          name: 'foo',
          description: null,
          visibility,
          modifiers: [],
          return: null,
          params: [],
        };
      }

      it('extracts visibility from jsdoc @access', () => {
        const def = statement(`
          class Foo {
            /**
             * @access private
             */
            foo() {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodVisibilityDoc('private')
        );
      });

      it('extracts visibility from jsdoc @private', () => {
        const def = statement(`
          class Foo {
            /**
             * @private
             */
            foo() {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodVisibilityDoc('private')
        );
      });

      it('returns public if no jsdoc', () => {
        const def = statement(`
          class Foo {
            foo() {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodVisibilityDoc('public')
        );
      });
    });

    describe('modifiers', () => {

      function methodModifiersDoc(modifiers) {
        return {
          name: 'foo',
          description: null,
          visibility: 'public',
          modifiers,
          return: null,
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
        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc([])
        );
      });

      it('detects static functions', () => {
        const def = statement(`
          class Foo {
            static foo() {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodModifiersDoc(['static'])
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
          methodModifiersDoc(['generator'])
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
          methodModifiersDoc(['async'])
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
          methodModifiersDoc(['static', 'async'])
        );
      });
    });

    describe('return', () => {

      function methodReturnDoc(returnValue) {
        return {
          name: 'foo',
          description: null,
          visibility: 'public',
          modifiers: [],
          return: returnValue,
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
        expect(getMethodDocumentation(method)).toEqual(
          methodReturnDoc(null)
        );
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
            description: null,
            type: {name: 'number'},
          })
        );
      });

      it('extracts description from jsdoc', () => {
        const def = statement(`
          class Foo {
            /**
             * @returns nothing
             */
            foo () {}
          }
        `);
        const method = def.get('body', 'body', 0);
        expect(getMethodDocumentation(method)).toEqual(
          methodReturnDoc({
            description: 'nothing',
            type: null,
          })
        );
      });
    });
  });
});
