/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * @flow
 */
"use strict";

var match = require('./match');
var resolveToValue = require('./resolveToValue');
var types = require('recast').types.namedTypes;

function resolveToCallExpression(path: NodePath): ?string {
  var node = path.node;
  switch (node.type) {
    case types.Identifier.name:
      var valuePath = resolveToValue(path);
      if (valuePath !== path) {
        return resolveToCallExpression(valuePath);
      }
      break;
    case types.VariableDeclarator.name:
      if (node.init) {
        return resolveToCallExpression(path.get('init'));
      }
      break;
    case types.VariableDeclaration.name:
      return resolveToCallExpression(path.get('declarations', 0));
    case types.ExportDeclaration.name:
      return resolveToCallExpression(path.get('declaration'));
    case types.CallExpression.name:
    default:
      if (path) {
        return path;
      }
  }
}

module.exports = resolveToCallExpression;
