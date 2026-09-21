import {
  isArrayExpression,
  isArrowFunctionExpression,
  isCallExpression,
  isClassDeclaration,
  isClassExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isLiteral,
  isObjectExpression,
  type AstPath,
  type FileState,
} from '../internal.js';
import findTopLevelDefinition from './findTopLevelDefinition.js';
import getMemberName from './getMemberName.js';

export default function resolveComponentDefinition(
  file: FileState,
  path: AstPath,
): AstPath | null {
  if (
    path.node.type === 'ChainExpression' ||
    path.node.type === 'TypeCastExpression' ||
    path.node.type === 'TSAsExpression' ||
    path.node.type === 'TSNonNullExpression' ||
    path.node.type === 'TSSatisfiesExpression' ||
    path.node.type === 'TSTypeAssertion'
  ) {
    const expression = path.get('expression');

    return expression && !Array.isArray(expression)
      ? resolveComponentDefinition(file, expression)
      : null;
  }
  if (isIdentifier(path.node)) {
    const definition = findTopLevelDefinition(file, path.node.name);

    return definition ? resolveComponentDefinition(file, definition) : null;
  }

  if (
    isFunctionDeclaration(path.node) ||
    isFunctionExpression(path.node) ||
    isArrowFunctionExpression(path.node) ||
    isClassDeclaration(path.node) ||
    isClassExpression(path.node)
  ) {
    return path;
  }

  if (!isCallExpression(path.node)) {
    return null;
  }

  if (
    getMemberName(path.node.callee) === 'React.createClass' ||
    getMemberName(path.node.callee) === 'createReactClass'
  ) {
    return path;
  }

  const argumentsPaths = path.get('arguments');

  if (!Array.isArray(argumentsPaths) || argumentsPaths.length === 0) {
    return null;
  }

  const [first] = argumentsPaths;

  if (!first) {
    return null;
  }

  const useLast =
    argumentsPaths.length > 1 &&
    (isLiteral(first.node) ||
      isObjectExpression(first.node) ||
      isArrayExpression(first.node) ||
      first.node.type === 'SpreadElement');
  const candidate = useLast ? argumentsPaths.at(-1) : first;

  return candidate ? resolveComponentDefinition(file, candidate) : null;
}
