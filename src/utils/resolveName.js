import recast from 'recast';

var {types: {namedTypes: types}} = recast;

export default function resolveName(path) {
  if (types.VariableDeclaration.check(path.node)) {
    var declarations = path.get('declarations');
    if (declarations.value.length && declarations.value.length !== 1) {
      throw new TypeError(
        'Got unsupported VariableDeclaration. VariableDeclaration must only ' +
        'have a single VariableDeclarator. Got ' + declarations.value.length +
        ' declarations.'
      );
    }
    var value = declarations.get(0, 'id', 'name').value;
    return value;
  }

  if (types.FunctionDeclaration.check(path.node)) {
    return path.get('id', 'name').value;
  }

  if (
    types.FunctionExpression.check(path.node) ||
    types.ArrowFunctionExpression.check(path.node)
  ) {
    if (!types.VariableDeclarator.check(path.parent.node)) {
      return; // eslint-disable-line consistent-return
    }

    return path.parent.get('id', 'name').value;
  }

  throw new TypeError(
    'Attempted to resolveName for an unsupported path. resolveName accepts a ' +
    'VariableDeclaration, FunctionDeclaration, or FunctionExpression. Got "' +
    path.node.type + '".'
  );
}
