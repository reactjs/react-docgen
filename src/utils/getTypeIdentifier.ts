import type { NodePath } from '@babel/traverse';

export default function getTypeIdentifier(path: NodePath): NodePath | null {
  if (path.has('id')) {
    return path.get('id') as NodePath;
  } else if (path.isTSTypeReference()) {
    return path.get('typeName');
  } else if (path.isTSExpressionWithTypeArguments()) {
    return path.get('expression');
  }

  return null;
}
