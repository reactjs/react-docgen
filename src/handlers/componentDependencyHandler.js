
import type Documentation from '../Documentation';

import getMemberValuePath from '../utils/getMemberValuePath';
import recast from 'recast';
import resolveToModule from '../utils/resolveToModule';
import resolveToValue from '../utils/resolveToValue';

var {types: {namedTypes: types}} = recast;

/**
 * It resolves the path to its module name and adds it to the "dependencies" entry
 * in the documentation.
 */
function amendDependencies(documentation, path, variableDeclarations, jsx) {
  var moduleName = resolveToModule(path) || path.value
  //  If module is a declaration, ignore them
  //  If path is jsx, assume module is jsx
  if (!variableDeclarations[moduleName] && jsx[path.value]) {
    documentation.addDependencies(moduleName);
  }
}

export default function componentDependencyHandler(
  documentation: Documentation,
  path: NodePath
) {
  let identifiers = []
  let jsx = {}
  let variableDeclarations = {}
  recast.visit(path.parentPath.parentPath, {
    visitNode: function(path) {
      if (path.get('type').value === 'VariableDeclaration') {
        path.get('declarations').value.forEach(node => {
          variableDeclarations[node.id.name] = true
        })
      }
      this.traverse(path)
    },
    visitIdentifier: function(path) {
      var componentPath;
      if (path.get('type').value === 'JSXIdentifier') {
        componentPath = path.get('name');
        jsx[componentPath.value] = true
      } else if (path.get('name').value === 'createElement') {
        //  Get first argument in React.createElement
        componentPath = path.parentPath.parentPath.get('arguments').get(0);
        jsx[componentPath.value] = true
      } else if (path.get('type').value === 'Identifier') {
        componentPath = path.get('name');
      }

      if (componentPath) {
        identifiers.push(componentPath);
      }
      this.traverse(path)
    },
  });
  identifiers.forEach(path => amendDependencies(documentation, path, variableDeclarations, jsx))
}
