import type { NodePath } from 'ast-types/lib/node-path';
import strip from 'strip-indent';
import toBabel from 'estree-to-babel';
import generate from '@babel/generator';
import { FileNodeWithOptions } from '../babelParser';

function deindent(code: string): string {
  const firstNewLine = code.indexOf('\n');

  return (
    code.slice(0, firstNewLine + 1) +
    // remove indentation from all lines except first.
    strip(code.slice(firstNewLine + 1))
  );
}

function getSrcFromAst(path: NodePath): string {
  do {
    if (path.node.type === 'File') {
      return (path.node as FileNodeWithOptions).__src;
    }
    path = path.parentPath;
  } while (path != null);

  throw new Error('Could not find source attached to File node');
}

/**
 * Prints the given path without leading or trailing comments.
 */
export default function printValue(path: NodePath): string {
  if (path.node.start == null) {
    try {
      const nodeCopy = {
        ...path.node,
      };

      // `estree-to-babel` expects the `comments` property to exist on the top-level node
      if (!nodeCopy.comments) {
        nodeCopy.comments = [];
      }

      return generate(toBabel(nodeCopy), {
        comments: false,
        concise: true,
      }).code;
    } catch (err) {
      throw new Error(
        `Cannot print raw value for type '${path.node.type}'. Please report this with an example at https://github.com/reactjs/react-docgen/issues.

Original error:
${err.stack}`,
      );
    }
  }
  const src = getSrcFromAst(path);

  return deindent(src.slice(path.node.start, path.node.end));
}
