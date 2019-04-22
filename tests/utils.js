/**
 * Helper methods for tests.
 */

import _recast from 'recast';
import buildParser from '../src/babelParser';

function stringify(value) {
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  return value;
}

/**
 * Returns a NodePath to the program node of the passed node
 */
export function parse(src, recast = _recast, options = {}) {
  return new recast.types.NodePath(
    recast.parse(stringify(src), { parser: buildParser(options) }).program,
  );
}

export function statement(src, recast = _recast, options) {
  return parse(src, recast, options).get('body', 0);
}

export function expression(src, recast = _recast, options) {
  return statement('(' + src + ')', recast, options).get('expression');
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
