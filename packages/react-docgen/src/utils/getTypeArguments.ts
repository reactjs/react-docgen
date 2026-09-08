import type { NodePath } from '@babel/traverse';
import type {
  TSTypeParameterInstantiation,
  TypeParameterInstantiation,
} from '@babel/types';

/** Reads type arguments from both Babel 7 and Babel 8 ASTs. */
export default function getTypeArguments(
  path: NodePath,
): NodePath<
  TSTypeParameterInstantiation | TypeParameterInstantiation | null | undefined
> {
  return path.get(
    'typeArguments' in path.node ? 'typeArguments' : 'typeParameters',
  ) as NodePath<
    TSTypeParameterInstantiation | TypeParameterInstantiation | null | undefined
  >;
}
