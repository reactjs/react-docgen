import type { NodePath } from '@babel/traverse';

export default function getTypeIdentifier(path: NodePath): NodePath | null {
  if ('id' in path.node && path.node.id) {
    return path.get('id') as NodePath;
  } else if (path.isTSTypeReference()) {
    return path.get('typeName');
  } else if (
    [
      'TSExpressionWithTypeArguments',
      'TSInterfaceHeritage',
      'TSClassImplements',
    ].includes(path.node.type)
  ) {
    return path.get('expression') as NodePath;
  }

  return null;
}
