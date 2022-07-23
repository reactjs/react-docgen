import getMemberValuePath from '../utils/getMemberValuePath';
import resolveToModule from '../utils/resolveToModule';
import resolveToValue from '../utils/resolveToValue';
import type Documentation from '../Documentation';
import type { NodePath } from '@babel/traverse';
import type { ObjectExpression, Node } from '@babel/types';

/**
 * It resolves the path to its module name and adds it to the "composes" entry
 * in the documentation.
 */
function amendComposes(documentation: Documentation, path: NodePath): void {
  const moduleName = resolveToModule(path);
  if (moduleName) {
    documentation.addComposes(moduleName);
  }
}

function processObjectExpression(
  documentation: Documentation,
  path: NodePath<ObjectExpression>,
): void {
  path.get('properties').forEach(propertyPath => {
    if (propertyPath.isSpreadElement()) {
      amendComposes(
        documentation,
        resolveToValue(propertyPath.get('argument')),
      );
    }
  });
}

export default function propTypeCompositionHandler(
  documentation: Documentation,
  path: NodePath,
): void {
  let propTypesPath: NodePath<Node> | null = getMemberValuePath(
    path,
    'propTypes',
  );
  if (!propTypesPath) {
    return;
  }
  propTypesPath = resolveToValue(propTypesPath);
  if (!propTypesPath) {
    return;
  }

  if (propTypesPath.isObjectExpression()) {
    processObjectExpression(documentation, propTypesPath);
    return;
  }

  amendComposes(documentation, propTypesPath);
}
