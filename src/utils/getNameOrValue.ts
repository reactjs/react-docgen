import { namedTypes as t } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * If node is an Identifier, it returns its name. If it is a literal, it returns
 * its value.
 */
export default function getNameOrValue(path: NodePath, raw = false): string {
  const node = path.node;

  if (t.Identifier.check(node)) {
    return node.name;
  } else if (t.Literal.check(node)) {
    //@ts-ignore
    return raw ? node.raw : node.value;
  }

  throw new TypeError('Argument must be an Identifier or a Literal');
}
