
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
  }
}

export default function componentDependencyHandler(
  documentation: Documentation,
  path: NodePath
) {
  var renderPath = getMemberValuePath(path, 'render');

  //  Arrow functions
  if (!renderPath) {
      renderPath = path;
  }

  recast.visit(renderPath, {
    visitIdentifier: function(path) {
      if (path.value.name !== 'createElement') {
        return false;
      }

      const componentPath = path.parentPath.parentPath.get('arguments').get(0);
      amendDependencies(documentation, componentPath);

      return false;
    },
  });
}
