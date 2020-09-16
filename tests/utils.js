/**
 * Helper methods for tests.
 */

import { NodePath } from 'ast-types';
import buildParser from '../src/babelParser';

function stringify(value) {
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  return value;
}

export function getParser(options = {}) {
  return buildParser(options);
}
/**
 * Returns a NodePath to the program node of the passed node
 */
export function parse(src, options = {}) {
  const ast = getParser(options).parse(stringify(src));
  ast.__src = src;

  return new NodePath(ast).get('program');
}

export function statement(src, options) {
  return parse(src, options).get('body', 0);
}

export function expression(src, options) {
  return statement('(' + src + ')', options).get('expression');
}

/**
 * Injects src into template by replacing the occurrence of %s.
 */
export function parseWithTemplate(src, template) {
  return parse(template.replace('%s', stringify(src)));
}

/**
 * Default template that simply defines React and PropTypes.
 */
export const REACT_TEMPLATE = [
  'var React = require("React");',
  'var PropTypes = React.PropTypes;',
  'var {PropTypes: OtherPropTypes} = require("React");',
  '%s;',
].join('\n');

export const MODULE_TEMPLATE = [
  'var React = require("React");',
  'var PropTypes = React.PropTypes;',
  'var Component = React.createClass(%s);',
  'module.exports = Component',
].join('\n');

/**
 * Importer that doesn't resolve any values
 */
export function noopImporter() {
  return null;
}
