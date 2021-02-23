import resolveGenericTypeAnnotation from '../utils/resolveGenericTypeAnnotation';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

export type TypeParameters = Record<string, NodePath>;

export default function getTypeParameters(
  declaration: NodePath,
  instantiation: NodePath,
  inputParams: TypeParameters | null | undefined,
  importer: Importer,
): TypeParameters {
  const params = {};
  const numInstantiationParams = instantiation.node.params.length;

  let i = 0;
  declaration.get('params').each((paramPath: NodePath) => {
    const key = paramPath.node.name;
    const defaultTypePath = paramPath.node.default
      ? paramPath.get('default')
      : null;
    const typePath =
      i < numInstantiationParams
        ? instantiation.get('params', i++)
        : defaultTypePath;

    if (typePath) {
      let resolvedTypePath =
        resolveGenericTypeAnnotation(typePath, importer) || typePath;
      const typeName =
        resolvedTypePath.node.typeName || resolvedTypePath.node.id;
      if (typeName && inputParams && inputParams[typeName.name]) {
        resolvedTypePath = inputParams[typeName.name];
      }

      params[key] = resolvedTypePath;
    }
  });

  return params;
}
