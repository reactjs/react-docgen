import getMemberValuePath from '../utils/getMemberValuePath.js';
import resolveToModule from '../utils/resolveToModule.js';
import resolveToValue from '../utils/resolveToValue.js';
import type Documentation from '../Documentation.js';
import type { NodePath } from '@babel/traverse';
import type { ObjectExpression } from '@babel/types';
import type { Handler } from './index.js';
import type { ComponentNode } from '../resolver/index.js';

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
  path.get('properties').forEach((propertyPath) => {
    if (propertyPath.isSpreadElement()) {
      amendComposes(
        documentation,
        resolveToValue(propertyPath.get('argument')),
      );
    }
  });
}

const propTypeCompositionHandler: Handler = function (
  documentation: Documentation,
  componentDefinition: NodePath<ComponentNode>,
): void {
  let propTypesPath: NodePath | null = getMemberValuePath(
    componentDefinition,
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
};

export default propTypeCompositionHandler;
