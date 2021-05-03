import { namedTypes as t } from 'ast-types';
import match from './match';
import resolveToValue from './resolveToValue';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * Given a path (e.g. call expression, member expression or identifier),
 * this function tries to find the name of module from which the "root value"
 * was imported.
 */
export default function resolveToModule(
  path: NodePath,
  importer: Importer,
): string | null {
  const node = path.node;
  switch (node.type) {
    // @ts-ignore
    case t.VariableDeclarator.name:
      if (node.init) {
        return resolveToModule(path.get('init'), importer);
      }
      break;

    // @ts-ignore
    case t.CallExpression.name:
      // @ts-ignore
      if (match(node.callee, { type: t.Identifier.name, name: 'require' })) {
        return node.arguments[0].value;
      }
      return resolveToModule(path.get('callee'), importer);

    // @ts-ignore
    case t.Identifier.name: // @ts-ignore
    case t.JSXIdentifier.name: {
      const valuePath = resolveToValue(path, importer);
      if (valuePath !== path) {
        return resolveToModule(valuePath, importer);
      }
      break;
    }

    // @ts-ignore
    case t.ImportDeclaration.name:
      return node.source.value;

    // @ts-ignore
    case t.MemberExpression.name:
      while (path && t.MemberExpression.check(path.node)) {
        path = path.get('object');
      }
      if (path) {
        return resolveToModule(path, importer);
      }
  }

  return null;
}
