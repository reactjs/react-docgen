import { namedTypes as t } from 'ast-types';
import resolveToValue from './resolveToValue';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

export default function resolveExportDeclaration(
  path: NodePath,
  importer: Importer,
): NodePath[] {
  const definitions: NodePath[] = [];
  if (path.node.default) {
    definitions.push(path.get('declaration'));
  } else if (path.node.declaration) {
    if (t.VariableDeclaration.check(path.node.declaration)) {
      path
        .get('declaration', 'declarations')
        .each(declarator => definitions.push(declarator));
    } else {
      definitions.push(path.get('declaration'));
    }
  } else if (path.node.specifiers) {
    path
      .get('specifiers')
      .each(specifier => definitions.push(specifier.get('local')));
  }
  return definitions.map(definition => resolveToValue(definition, importer));
}
