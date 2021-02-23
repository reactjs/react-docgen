import { ASTNode, namedTypes as t, visit } from 'ast-types';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactCreateClassCall from '../utils/isReactCreateClassCall';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import isStatelessComponent from '../utils/isStatelessComponent';
import normalizeClassDefinition from '../utils/normalizeClassDefinition';
import resolveToValue from '../utils/resolveToValue';
import type { Parser } from '../babelParser';
import type { Importer } from '../parse';
import { NodePath } from 'ast-types/lib/node-path';

/**
 * Given an AST, this function tries to find all object expressions that are
 * passed to `React.createClass` calls, by resolving all references properly.
 */
export default function findAllComponentDefinitions(
  ast: ASTNode,
  _parser: Parser,
  importer: Importer,
): NodePath[] {
  const definitions = new Set<NodePath>();

  function classVisitor(path) {
    if (isReactComponentClass(path, importer)) {
      normalizeClassDefinition(path);
      definitions.add(path);
    }
    return false;
  }

  function statelessVisitor(path) {
    if (isStatelessComponent(path, importer)) {
      definitions.add(path);
    }
    return false;
  }

  visit(ast, {
    visitFunctionDeclaration: statelessVisitor,
    visitFunctionExpression: statelessVisitor,
    visitArrowFunctionExpression: statelessVisitor,
    visitClassExpression: classVisitor,
    visitClassDeclaration: classVisitor,
    visitCallExpression: function (path): boolean | null | undefined {
      if (isReactForwardRefCall(path, importer)) {
        // If the the inner function was previously identified as a component
        // replace it with the parent node
        const inner = resolveToValue(path.get('arguments', 0), importer);
        definitions.delete(inner);
        definitions.add(path);

        // Do not traverse into arguments
        return false;
      } else if (isReactCreateClassCall(path, importer)) {
        const resolvedPath = resolveToValue(path.get('arguments', 0), importer);
        if (t.ObjectExpression.check(resolvedPath.node)) {
          definitions.add(resolvedPath);
        }

        // Do not traverse into arguments
        return false;
      }

      // If it is neither of the above cases we need to traverse further
      // as this call expression could be a HOC
      this.traverse(path);

      return;
    },
  });

  return Array.from(definitions);
}
