/**
 * Helper methods for tests.
 */

import { ASTNode, NodePath as NodePathConstructor } from 'ast-types';
import { NodePath } from 'ast-types/lib/node-path';
import buildParser, { Options, Parser } from '../src/babelParser';
import { Importer } from '../src/parse';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      toEqualASTNode: (expected: NodePath | ASTNode) => CustomMatcherResult;
    }
  }
}

export function getParser(options: Options = {}): Parser {
  return buildParser(options);
}
/**
 * Returns a NodePath to the program node of the passed node
 */
export function parse(src: string, options: Options = {}): NodePath {
  const ast = getParser(options).parse(src);
  ast.__src = src;

  return new NodePathConstructor(ast).get('program');
}

export function statement(
  src: string,
  options: Options = {},
  last = false,
): NodePath {
  const root = parse(src, options);
  return root.get('body', last ? root.node.body.length - 1 : 0);
}

export function expression(src: string, options: Options = {}): NodePath {
  return statement(`(${src})`, options).get('expression');
}

export function expressionLast(src: string, options: Options = {}): NodePath {
  return statement(src, options, true).get('expression');
}

/**
 * Injects src into template by replacing the occurrence of %s.
 */
export function parseWithTemplate(src: string, template: string): NodePath {
  return parse(template.replace('%s', src));
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
export function noopImporter(): null {
  return null;
}

/**
 * Builds an importer where the keys are import paths and the values are AST nodes
 */
export function makeMockImporter(
  mocks: Record<string, NodePath> = {},
): Importer {
  return (path: NodePath): NodePath => {
    const source = path.node.source.value;
    return mocks[source];
  };
}
