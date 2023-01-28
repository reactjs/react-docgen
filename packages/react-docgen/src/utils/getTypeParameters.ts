import resolveGenericTypeAnnotation from '../utils/resolveGenericTypeAnnotation.js';
import type { NodePath } from '@babel/traverse';
import type {
  Identifier,
  QualifiedTypeIdentifier,
  TSQualifiedName,
  TSTypeParameter,
  TSTypeParameterDeclaration,
  TSTypeParameterInstantiation,
  TypeParameter,
  TypeParameterDeclaration,
  TypeParameterInstantiation,
} from '@babel/types';

export type TypeParameters = Record<string, NodePath>;

export default function getTypeParameters(
  declaration: NodePath<TSTypeParameterDeclaration | TypeParameterDeclaration>,
  instantiation: NodePath<
    TSTypeParameterInstantiation | TypeParameterInstantiation
  >,
  inputParams: TypeParameters | null | undefined,
): TypeParameters {
  const params: TypeParameters = {};
  const numInstantiationParams = instantiation.node.params.length;

  let i = 0;

  declaration
    .get('params')
    .forEach((paramPath: NodePath<TSTypeParameter | TypeParameter>) => {
      const key = paramPath.node.name;
      const defaultProp = paramPath.get('default');
      const defaultTypePath = defaultProp.hasNode() ? defaultProp : null;
      const typePath =
        i < numInstantiationParams
          ? instantiation.get('params')[i++]
          : defaultTypePath;

      if (typePath) {
        let resolvedTypePath: NodePath =
          resolveGenericTypeAnnotation(typePath) || typePath;
        let typeName:
          | NodePath<Identifier | QualifiedTypeIdentifier | TSQualifiedName>
          | undefined;

        if (resolvedTypePath.isTSTypeReference()) {
          typeName = resolvedTypePath.get('typeName');
        } else if (resolvedTypePath.isGenericTypeAnnotation()) {
          typeName = resolvedTypePath.get('id');
        }

        if (
          typeName &&
          inputParams &&
          typeName.isIdentifier() &&
          inputParams[typeName.node.name]
        ) {
          resolvedTypePath = inputParams[typeName.node.name];
        }

        params[key] = resolvedTypePath;
      }
    });

  return params;
}
