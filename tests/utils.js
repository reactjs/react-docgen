/**
 * Helper methods for tests.
 */

import _recast from 'recast';
import flow from '../src/flow-parser';

function stringify(value) {
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  return value;
}

/**
 * Returns a NodePath to the program node of the passed node
 */
export function parse(src, recast=_recast) {
  return new recast.types.NodePath(
    recast.parse(stringify(src), {esprima: flow}).program
  );
}

export function statement(src, recast=_recast) {
  return parse(src, recast).get('body', 0);
}

export function expression(src, recast=_recast) {
  return statement('(' + src + ')', recast).get('expression');
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
export var REACT_TEMPLATE = [
  'var React = require("React");',
  'var PropTypes = React.PropTypes;',
  'var {PropTypes: OtherPropTypes} = require("React");',
  '%s;',
].join('\n');

export var MODULE_TEMPLATE = [
  'var React = require("React");',
  'var PropTypes = React.PropTypes;',
  'var Component = React.createClass(%s);',
  'module.exports = Component',
].join('\n');
