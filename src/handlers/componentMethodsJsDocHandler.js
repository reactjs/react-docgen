/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import parseJsDoc from '../utils/parseJsDoc';

import type Documentation from '../Documentation';

// Merges two objects ignoring null/undefined.
function merge(obj1, obj2) {
  if (obj1 == null && obj2 == null) {
    return null;
  }
  const merged = {...obj1};
  for (const prop in obj2) {
    if (obj2[prop] != null) {
      merged[prop] = obj2[prop];
    }
  }
  return merged;
}
/**
 * Extract info from the methods jsdoc blocks. Must be run after
 * flowComponentMethodsHandler.
 */
export default function componentMethodsJsDocHandler(
  documentation: Documentation
) {
  let methods = documentation.get('methods');
  if (!methods) {
    return;
  }

  methods = methods.map(method => {
    if (!method.docblock) {
      return method;
    }

    const jsDoc = parseJsDoc(method.docblock);
    const returns = merge(jsDoc.returns, method.returns);
    const params = method.params.map(param => {
      const jsDocParam = jsDoc.params.find(p => p.name === param.name || param.name === "..." + p.name);
      return merge(jsDocParam, param);
    });

    return {
      ...method,
      description: jsDoc.description || null,
      returns,
      params,
    };
  });

  documentation.set('methods', methods);
}
