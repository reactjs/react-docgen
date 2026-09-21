import {
  isAssignmentExpression,
  isClassDeclaration,
  isExportDefaultDeclaration,
  isExportNamedDeclaration,
  isFunctionDeclaration,
  isExpressionStatement,
  isIdentifier,
  isMemberExpression,
  isVariableDeclaration,
  isVariableDeclarator,
  type AstPath,
  type Resolver,
} from '../internal.js';
import getBody from '../utils/getBody.js';
import findTopLevelDefinition from '../utils/findTopLevelDefinition.js';
import resolveComponentDefinition from '../utils/resolveComponentDefinition.js';
import hasComponentAnnotation from '../utils/hasComponentAnnotation.js';

const findExportedDefinitions: Resolver = (file) => {
  const definitions = new Set<AstPath>();

  for (const path of getBody(file)) {
    if (
      isVariableDeclaration(path.node) &&
      hasComponentAnnotation(file, path.node)
    ) {
      const declarations = path.get('declarations');

      if (Array.isArray(declarations)) {
        for (const declaration of declarations) {
          if (!isVariableDeclarator(declaration.node)) continue;
          const init = declaration.get('init');

          if (!init || Array.isArray(init)) continue;
          const definition = resolveComponentDefinition(file, init);

          if (definition) definitions.add(definition);
        }
      }
    }

    if (
      (isExportNamedDeclaration(path.node) ||
        isExportDefaultDeclaration(path.node)) &&
      path.node.declaration
    ) {
      const declaration = path.get('declaration');

      if (
        declaration &&
        !Array.isArray(declaration) &&
        (isFunctionDeclaration(declaration.node) ||
          isClassDeclaration(declaration.node))
      ) {
        if (
          !isFunctionDeclaration(declaration.node) ||
          !declaration.node.id ||
          /^[A-Z]/.test(declaration.node.id.name)
        ) {
          definitions.add(declaration);
        }
      } else if (
        declaration &&
        !Array.isArray(declaration) &&
        isVariableDeclaration(declaration.node)
      ) {
        const variables = declaration.get('declarations');

        if (Array.isArray(variables)) {
          for (const variable of variables) {
            if (!isVariableDeclarator(variable.node)) continue;
            const init = variable.get('init');

            if (!init || Array.isArray(init)) continue;
            const definition = resolveComponentDefinition(file, init);

            if (definition) definitions.add(definition);
          }
        }
      } else if (declaration && !Array.isArray(declaration)) {
        const definition = resolveComponentDefinition(file, declaration);

        if (definition) {
          definitions.add(definition);
        }
      }

      continue;
    }

    if (!isExpressionStatement(path.node)) {
      continue;
    }

    const assignment = path.node.expression;

    if (
      !isAssignmentExpression(assignment) ||
      assignment.operator !== '=' ||
      !isMemberExpression(assignment.left) ||
      assignment.left.computed ||
      (!isIdentifier(assignment.right) &&
        assignment.right.type !== 'CallExpression')
    ) {
      continue;
    }

    const object = assignment.left.object;
    const property = assignment.left.property;
    const isModuleExport =
      isIdentifier(object, { name: 'module' }) &&
      isIdentifier(property, { name: 'exports' });
    const isNamedExport = isIdentifier(object, { name: 'exports' });

    if (!isModuleExport && !isNamedExport) {
      continue;
    }

    const expression = path.get('expression');
    const right =
      expression && !Array.isArray(expression) ? expression.get('right') : null;
    const definition = isIdentifier(assignment.right)
      ? findTopLevelDefinition(file, assignment.right.name)
      : right && !Array.isArray(right)
        ? resolveComponentDefinition(file, right)
        : null;

    if (definition) {
      definitions.add(definition);
    }
  }

  return [...definitions];
};

export default findExportedDefinitions;
