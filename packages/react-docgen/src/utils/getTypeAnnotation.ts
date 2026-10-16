import type { NodePath } from '@babel/traverse';
import type { FlowType, Node, TSType } from '@babel/types';

/**
 * Gets the most inner valuable TypeAnnotation from path. If no TypeAnnotation
 * can be found null is returned
 */
export default function getTypeAnnotation<T extends Node = FlowType | TSType>(
  path: NodePath<Node | null | undefined>,
): NodePath<T> | null {
  if (
    !path.node ||
    !('typeAnnotation' in path.node) ||
    !path.node.typeAnnotation
  )
    return null;

  let resultPath = path;

  do {
    resultPath = resultPath.get('typeAnnotation') as NodePath;
  } while (
    resultPath.node &&
    'typeAnnotation' in resultPath.node &&
    resultPath.node.typeAnnotation &&
    !resultPath.isFlowType() &&
    !resultPath.isTSType()
  );

  return resultPath as NodePath<T>;
}
