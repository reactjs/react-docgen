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

jest.disableAutomock();

describe('parseJsDoc', () => {
  let parseJsDoc;

  beforeEach(() => {
    parseJsDoc = require('../parseJsDoc').default;
  });

  describe('description', () => {
    it('extracts the method description in jsdoc', () => {
      const docblock = `
        Don't use this!
      `;
      expect(parseJsDoc(docblock)).toEqual({
        description: 'Don\'t use this!',
        returns: null,
        params: [],
      });
    });
  });

  describe('parameters', () => {

    it('extracts jsdoc description', () => {
      const docblock = `
        @param bar test
      `;
      expect(parseJsDoc(docblock)).toEqual({
        description: null,
        returns: null,
        params: [{
          name: 'bar',
          type: null,
          description: 'test',
        }],
      });
    });

    it('extracts jsdoc description', () => {
      const docblock = `
        @param {string} bar
      `;
      expect(parseJsDoc(docblock)).toEqual({
        description: null,
        returns: null,
        params: [{
          name: 'bar',
          type: {name: 'string'},
          description: null,
        }],
      });
    });

    it('extracts jsdoc union type param', () => {
      const docblock = `
        @param {string|Object} bar
      `;
      expect(parseJsDoc(docblock)).toEqual({
        description: null,
        returns: null,
        params: [{
          name: 'bar',
          type: {name: 'union', value: ['string', 'Object']},
          description: null,
        }],
      });
    });

    it('extracts jsdoc optional', () => {
      const docblock = `
        @param {string=} bar
      `;
      expect(parseJsDoc(docblock)).toEqual({
        description: null,
        returns: null,
        params: [{
          name: 'bar',
          type: {name: 'string'},
          description: null,
          optional: true,
        }],
      });
    });

    describe('returns', () => {

      it('returns null if return is not documented', () => {
        const docblock = `
          test
        `;
        expect(parseJsDoc(docblock)).toEqual({
          description: 'test',
          returns: null,
          params: [],
        });
      });

      it('extracts jsdoc types', () => {
        const docblock = `
          @returns {string}
        `;
        expect(parseJsDoc(docblock)).toEqual({
          description: null,
          returns: {
            type: {name: 'string'},
            description: null,
          },
          params: [],
        });
      });

      it('extracts jsdoc mixed types', () => {
        const docblock = `
          @returns {*}
        `;
        expect(parseJsDoc(docblock)).toEqual({
          description: null,
          returns: {
            type: {name: 'mixed'},
            description: null,
          },
          params: [],
        });
      });

      it('extracts description from jsdoc', () => {
        const docblock = `
          @returns The number
        `;
        expect(parseJsDoc(docblock)).toEqual({
          description: null,
          returns: {
            type: null,
            description: 'The number',
          },
          params: [],
        });
      });

      it('works with @return', () => {
        const docblock = `
          @return The number
        `;
        expect(parseJsDoc(docblock)).toEqual({
          description: null,
          returns: {
            type: null,
            description: 'The number',
          },
          params: [],
        });
      });
    });
  });
});
