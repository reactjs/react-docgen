/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

var babylon = require('babylon');

var options = {
  sourceType: 'module',
  strictMode: false,
  locations: true,
  ranges: true,
  ecmaVersion: 7,
  features: {
    'es7.classProperties': true,
    'es7.decorators': true,
    'es7.comprehensions': true,
    'es7.asyncFunctions': true,
    'es7.exportExtensions': true,
    'es7.trailingFunctionCommas': true,
    'es7.objectRestSpread': true,
  },
  plugins: { jsx: true, flow: true },
};

export default {
  parse(src) {
    var file = babylon.parse(src, options);
    file.program.comments = file.comments;
    return file.program;
  },
};
