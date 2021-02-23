import { namedTypes as t } from 'ast-types';
import getMemberValuePath from '../utils/getMemberValuePath';
import resolveToModule from '../utils/resolveToModule';
import resolveToValue from '../utils/resolveToValue';
import type Documentation from '../Documentation';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * It resolves the path to its module name and adds it to the "composes" entry
 * in the documentation.
 */
function amendComposes(
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
): void {
  const moduleName = resolveToModule(path, importer);
  if (moduleName) {
    documentation.addComposes(moduleName);
  }
}

function processObjectExpression(
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
): void {
  path.get('properties').each(function (propertyPath) {
    switch (propertyPath.node.type) {
      // @ts-ignore
      case t.SpreadElement.name:
        amendComposes(
          documentation,
          resolveToValue(propertyPath.get('argument'), importer),
          importer,
        );
        break;
    }
  });
}

export default function propTypeCompositionHandler(
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
): void {
  let propTypesPath = getMemberValuePath(path, 'propTypes', importer);
  if (!propTypesPath) {
    return;
  }
  propTypesPath = resolveToValue(propTypesPath, importer);
  if (!propTypesPath) {
    return;
  }

  switch (propTypesPath.node.type) {
    // @ts-ignore
    case t.ObjectExpression.name:
      processObjectExpression(documentation, propTypesPath, importer);
      break;
    default:
      amendComposes(documentation, propTypesPath, importer);
      break;
  }
}
