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
  plugins: [
    'jsx',
    'flow',
    'estree',
    'doExpressions',
    'objectRestSpread',
    'decorators',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'exportExtensions',
    'asyncGenerators',
    'functionBind',
    'functionSent',
    'dynamicImport',
    'numericSeparator',
    'optionalChaining',
    'importMeta',
    'bigInt',
    'optionalCatchBinding',
    'throwExpressions',
    'pipelineOperator',
    'nullishCoalescingOperator',
  ],
};

export default {
  parse(src) {
    var file = babylon.parse(src, options);
    file.program.comments = file.comments;
    return file.program;
  },
};
