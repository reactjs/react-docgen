const { NodePath } = require('ast-types');

module.exports = {
  print(val, serialize) {
    return serialize(val.node);
  },

  test(val) {
    return val && val instanceof NodePath;
  },
};
