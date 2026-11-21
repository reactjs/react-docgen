import getTypeArguments from './getTypeArguments.js';
import type { NodePath } from '@babel/traverse';
import isReactBuiltinReference from './isReactBuiltinReference.js';

const BUILTIN_PROP_WRAPPER_NAMES = [
  'PropsWithoutRef',
  'PropsWithRef',
  'PropsWithChildren',
];

/**
 * Unwraps NodePaths from the builtin types `PropsWithoutRef`,
 * `PropsWithRef` and `PropsWithChildren` and returns the inner type param.
 * Both the TypeScript (`TSTypeReference`) and the Flow
 * (`GenericTypeAnnotation`) representation are supported.
 * If none of the builtin types is detected the path is returned as-is
 */
export default function unwrapBuiltinTSPropTypes(typePath: NodePath): NodePath {
  const isSupportedReference =
    typePath.isTSTypeReference() || typePath.isGenericTypeAnnotation();

  if (isSupportedReference) {
    const typeName = typePath.isTSTypeReference()
      ? typePath.get('typeName')
      : typePath.get('id');

    const isBuiltinWrapper = BUILTIN_PROP_WRAPPER_NAMES.some((name) =>
      isReactBuiltinReference(typeName, name),
    );

    if (isBuiltinWrapper) {
      const typeParameters = getTypeArguments(typePath);

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
