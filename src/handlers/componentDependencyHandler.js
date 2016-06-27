
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
function amendDependencies(documentation, path) {
  var moduleName = resolveToModule(path);
  if (moduleName) {
    documentation.addDependencies(moduleName);
  } else {
    //  Naive tags like div
    documentation.addDependencies(path.get('value').value);
  }
}

export default function componentDependencyHandler(
  documentation: Documentation,
  path: NodePath
) {
  var renderPath = getMemberValuePath(path, 'render');

  //  Function components
  if (!renderPath) {
    renderPath = path;
  }

  recast.visit(renderPath, {
    visitIdentifier: function(path) {
      var componentPath;
      if (path.get('type').value === 'JSXIdentifier') {
        componentPath = path.get('name');
      } else if (path.get('name').value === 'createElement') {
        //  Get first argument in React.createElement
        componentPath = path.parentPath.parentPath.get('arguments').get(0);
      }

      if (componentPath) {
        amendDependencies(documentation, componentPath);
      }

      return false;
    },
  });
}
