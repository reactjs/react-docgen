import { ASTNode } from 'ast-types';

type Pattern = { [key: string]: number | string | Pattern };

/**
 * This function takes an AST node and matches it against "pattern". Pattern
 * is simply a (nested) object literal and it is traversed to see whether node
 * contains those (nested) properties with the provided values.
 */
export default function match(node: ASTNode, pattern: Pattern): boolean {
  if (!node) {
    return false;
  }
  for (const prop in pattern) {
    if (!node[prop]) {
      return false;
    }
    if (pattern[prop] && typeof pattern[prop] === 'object') {
      // @ts-ignore
      if (!match(node[prop], pattern[prop])) {
        return false;
      }
    } else if (node[prop] !== pattern[prop]) {
      return false;
    }
  }
  return true;
}
