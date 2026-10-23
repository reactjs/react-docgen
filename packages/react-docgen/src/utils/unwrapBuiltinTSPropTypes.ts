import type { NodePath } from '@babel/traverse';
import isReactBuiltinReference from './isReactBuiltinReference.js';
import resolveToValue from './resolveToValue.js';

/**
 * Unwraps NodePaths from the builtin TS types `PropsWithoutRef`,
 * `PropsWithRef`, `PropsWithChildren` and the global `Readonly` utility.
 * If none of the builtin types is detected the path is returned as-is
 */
export default function unwrapBuiltinTSPropTypes(typePath: NodePath): NodePath {
  if (typePath.isTSTypeReference()) {
    const typeName = typePath.get('typeName');

    if (
      (typeName.isIdentifier({ name: 'Readonly' }) &&
        resolveToValue(typeName) === typeName) ||
      isReactBuiltinReference(typeName, 'PropsWithoutRef') ||
      isReactBuiltinReference(typeName, 'PropsWithRef') ||
      isReactBuiltinReference(typeName, 'PropsWithChildren')
    ) {
      const typeParameters = typePath.get('typeParameters');

      if (typeParameters.hasNode()) {
        const innerType = typeParameters.get('params')[0];

        if (innerType) {
          return unwrapBuiltinTSPropTypes(innerType);
        }
      }
    }
  }

  return typePath;
}
