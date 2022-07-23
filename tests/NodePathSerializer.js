const { NodePath } = require('@babel/traverse');
const { removePropertiesDeep } = require('@babel/types');

function removeUndefinedProperties(node) {
  for (const key of Object.keys(node)) {
    if (node[key] === undefined) {
      delete node[key];
    } else if (node[key] === Object(node[key])) {
      node[key] = removeUndefinedProperties(node[key]);
    }
  }

  return node;
}

module.exports = {
  print(val, serialize) {
    return serialize(removeUndefinedProperties(removePropertiesDeep(val.node)));
  },

  test(val) {
    return val && val instanceof NodePath;
  },
};
