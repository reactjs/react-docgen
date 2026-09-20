import type { AstPath, FileState } from '../internal.js';

export default function getBody(file: FileState): AstPath[] {
  const body = file.path.get('body');

  return Array.isArray(body) ? body : [];
}
