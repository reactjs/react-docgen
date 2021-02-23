import { namedTypes as t } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';

function hasTypeAnnotation(path: NodePath): boolean {
  return !!path.node.typeAnnotation;
}

/**
 * Gets the most inner valuable TypeAnnotation from path. If no TypeAnnotation
 * can be found null is returned
 */
export default function getTypeAnnotation(path: NodePath): NodePath | null {
  if (!hasTypeAnnotation(path)) return null;

  let resultPath: NodePath = path;
  do {
    resultPath = resultPath.get('typeAnnotation');
  } while (
    hasTypeAnnotation(resultPath) &&
    !t.FlowType.check(resultPath.node) &&
    !t.TSType.check(resultPath.node)
  );

  return resultPath;
}
