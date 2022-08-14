import resolveToValue from './resolveToValue';
import type {
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
} from '@babel/types';
import type { NodePath } from '@babel/traverse';

export default function resolveExportDeclaration(
  path: NodePath<ExportDefaultDeclaration | ExportNamedDeclaration>,
): NodePath[] {
  const definitions: NodePath[] = [];

  if (path.isExportDefaultDeclaration()) {
    definitions.push(path.get('declaration'));
  } else if (path.isExportNamedDeclaration()) {
    if (path.has('declaration')) {
      const declaration = path.get('declaration');

      if (declaration.isVariableDeclaration()) {
        declaration
          .get('declarations')
          .forEach(declarator => definitions.push(declarator));
      } else if (declaration.isDeclaration()) {
        definitions.push(declaration);
      }
    } else if (path.has('specifiers')) {
      path
        .get('specifiers')
        .forEach(specifier =>
          definitions.push(specifier.get('local') as NodePath),
        );
    }
  }

  return definitions.map(definition => resolveToValue(definition));
}
