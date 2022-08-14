import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import getMemberValuePath from '../utils/getMemberValuePath';
import resolveToValue from '../utils/resolveToValue';
import setPropDescription from '../utils/setPropDescription';
import type Documentation from '../Documentation';
import type { ComponentNode } from '../resolver';
import type { Handler } from '.';

function resolveDocumentation(
  documentation: Documentation,
  path: NodePath,
): void {
  if (!path.isObjectExpression()) {
    return;
  }

  path.get('properties').forEach(propertyPath => {
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

const propDocBlockHandler: Handler = function (
  documentation: Documentation,
  componentDefinition: NodePath<ComponentNode>,
): void {
  let propTypesPath: NodePath<Node> | null = getMemberValuePath(
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

export default propDocBlockHandler;
