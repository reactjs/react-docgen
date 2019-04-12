/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function Documentation() {
  return {
    composes: [],
    descriptors: {},
    getPropDescriptor(name) {
      return this.descriptors[name] || (this.descriptors[name] = {});
    },
    addComposes(name) {
      this.composes.push(name);
    },
    set(key, value) {
      this[key] = value;
    },
  };
}

module.exports = Documentation;
