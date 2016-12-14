/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

const flow = require('flow-parser');

const options = {
  esproposal_decorators: true,
  esproposal_class_instance_fields: true,
  esproposal_class_static_fields: true,
  esproposal_export_star_as: true,
  types: true,
};

export default {
  parse(src) {
    const tree = flow.parse(src, options);
    if (tree.errors && tree.errors.length) {
      throw new Error({
        message: `Flow parser encountered errors: ${JSON.stringify(tree.errors)}`,
        errors: tree.errors,
      });
    }

    return tree;
  },
};
