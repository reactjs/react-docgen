import { NodePath } from '@babel/traverse';
import { removePropertiesDeep } from '@babel/types';
import type { expect } from 'vitest';

function removeUndefinedProperties(
  node: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of Object.keys(node)) {
    if (node[key] === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete node[key];
    } else if (node[key] === Object(node[key])) {
      node[key] = removeUndefinedProperties(
        node[key] as Record<string, unknown>,
      );
    }
  }

  return node;
}

export default {
  serialize(val, config, indentation, depth, refs, printer) {
    return printer(
      removeUndefinedProperties(removePropertiesDeep(val.node)),
      config,
      indentation,
      depth,
      refs,
    );
  },

  test(val) {
    return val && val instanceof NodePath;
  },
} as Parameters<typeof expect.addSnapshotSerializer>[0];
