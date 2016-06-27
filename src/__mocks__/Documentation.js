/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

function Documentation() {
  return {
    composes: [],
    dependencies: [],
    descriptors: {},
    getPropDescriptor(name) {
      return this.descriptors[name] || (this.descriptors[name] = {});
    },
    addComposes(name) {
      this.composes.push(name);
    },
    addDependencies(name) {
      if (this.dependencies.indexOf(name) === -1) {
        this.dependencies.push(name);
      }
    },
    set(key, value) {
      this[key] = value;
    },
  };
}

module.exports = Documentation;
