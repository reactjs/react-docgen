
import type Documentation from '../Documentation';

import recast from 'recast';
import resolveToModule from '../utils/resolveToModule';

var {types: {namedTypes: types}} = recast;

/**
 * It resolves the path to its module name and adds it to the "dependencies" entry
 * in the documentation.
 */
function addDependencies(documentation, paths, variableDeclarations, jsx) {
  const dependencies = {}
  paths
    .map(path => {
      let value = path.value

      var moduleName = resolveToModule(path)
      //  If module is a declaration, ignore them
      //  If path is jsx, assume module is jsx
      if (moduleName) {
        if (!variableDeclarations[moduleName] && jsx[value]) {
          return moduleName;
        }
      } else {
        //  Native tags
        if (typeof value !== 'string' && value.value) {
          return value.value;
        }
      }
    })
    .filter(p => !!p)
    .forEach(p => (dependencies[p] = true))

  documentation.set('dependencies', Object.keys(dependencies))
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
      if (path.get('type').value === 'JSXIdentifier' &&
        path.parentPath.get('type').value !== 'JSXAttribute') {
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
  addDependencies(documentation, identifiers, variableDeclarations, jsx)
}
