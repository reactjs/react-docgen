import type { NodePath } from '@babel/traverse';
import type { FlowType } from '@babel/types';

/**
 * Gets the most inner valuable TypeAnnotation from path. If no TypeAnnotation
 * can be found null is returned
 */
export default function getTypeAnnotation<T = FlowType>(
  path: NodePath,
): NodePath<T> | null {
  if (!path.has('typeAnnotation')) return null;

  let resultPath = path;

  do {
    resultPath = resultPath.get('typeAnnotation') as NodePath;
  } while (
    resultPath.has('typeAnnotation') &&
    !resultPath.isFlowType() &&
    !resultPath.isTSType()
  );

  // @ts-ignore
  return resultPath;
}
