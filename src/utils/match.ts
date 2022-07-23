import type { Node } from '@babel/traverse';

type Pattern = { [key: string]: Pattern | number | string };

/**
 * This function takes an AST node and matches it against "pattern". Pattern
 * is simply a (nested) object literal and it is traversed to see whether node
 * contains those (nested) properties with the provided values.
 */
export default function match(node: Node, pattern: Pattern): boolean {
  if (!node) {
    return false;
  }
  for (const prop in pattern) {
    if (!node[prop]) {
      return false;
    }
    if (pattern[prop] && typeof pattern[prop] === 'object') {
      if (!match(node[prop], pattern[prop] as Pattern)) {
        return false;
      }
    } else if (node[prop] !== pattern[prop]) {
      return false;
    }
  }
  return true;
}
