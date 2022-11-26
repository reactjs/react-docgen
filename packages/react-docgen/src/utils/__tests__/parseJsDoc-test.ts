import parseJsDoc from '../parseJsDoc.js';
import { describe, expect, test } from 'vitest';

describe('parseJsDoc', () => {
  describe('description', () => {
    test('extracts the method description in jsdoc', () => {
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

      test(name, () => {
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

      test(name, () => {
        expect(parseJsDoc(docBlock)).toMatchSnapshot();
      });
    });
  });
});
