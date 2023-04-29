import type { NodePath } from '@babel/traverse';
import getMemberValuePath from '../utils/getMemberValuePath.js';
import resolveToValue from '../utils/resolveToValue.js';
import setPropDescription from '../utils/setPropDescription.js';
import type Documentation from '../Documentation.js';
import type { ComponentNode } from '../resolver/index.js';
import type { Handler } from './index.js';

function resolveDocumentation(
  documentation: Documentation,
  path: NodePath,
): void {
  if (!path.isObjectExpression()) {
    return;
  }

  path.get('properties').forEach((propertyPath) => {
    if (propertyPath.isSpreadElement()) {
      const resolvedValuePath = resolveToValue(propertyPath.get('argument'));

      resolveDocumentation(documentation, resolvedValuePath);
    } else if (
      propertyPath.isObjectProperty() ||
      propertyPath.isObjectMethod()
    ) {
      setPropDescription(documentation, propertyPath);
    }
  });
}

const propDocblockHandler: Handler = function (
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

  resolveDocumentation(documentation, propTypesPath);
};

export default propDocblockHandler;
