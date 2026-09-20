import {
  isProgram,
  isVariableDeclaration,
  type AstPath,
  type FileState,
} from '../internal.js';
import getDescription from './getDescription.js';

export default function getComponentDescription(
  file: FileState,
  path: AstPath,
): string {
  for (
    let current: AstPath | null = path;
    current;
    current = current.parentPath
  ) {
    if (isVariableDeclaration(current.node)) {
      return getDescription(file, current.node);
    }
  }

  return getDescription(
    file,
    path.parentPath && !isProgram(path.parentPath.node)
      ? path.parentPath.node
      : path.node,
  );
}
