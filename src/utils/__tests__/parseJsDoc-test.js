/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
      expect(parseJsDoc(docblock)).toMatchSnapshot();
    });
  });
  describe('@param', () => {
    const docBlocks = {
      'extracts jsdoc description': '@param bar test',
      'extracts jsdoc empty description': '@param {string} bar',
      'extracts jsdoc union type param': '@param {string|Object|some[]} bar',
      'extracts jsdoc optional': '@param {string=} bar',
      'extracts jsdoc typed array': '@param {[string, number]} bar',
    };

    Object.keys(docBlocks).forEach(name => {
      const docBlock = docBlocks[name];
      it(name, () => {
        expect(parseJsDoc(docBlock)).toMatchSnapshot();
      });
    });
  });
  describe('@returns', () => {
    const docBlocks = {
      'extracts jsdoc types': '@returns {string}',
      'extracts jsdoc mixed types': '@returns {*}',
      'extracts description from jsdoc': '@returns The number',
      'works with @return': '@return The number',
      'extracts jsdoc typed array': '@param {[string, number]} bar',
    };

    Object.keys(docBlocks).forEach(name => {
      const docBlock = docBlocks[name];
      it(name, () => {
        expect(parseJsDoc(docBlock)).toMatchSnapshot();
      });
    });
  });
});
