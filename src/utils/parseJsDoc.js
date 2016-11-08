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

import doctrine from 'doctrine';

type JsDoc = {
  description: ?string;
  params: Array<{
    name: string;
    description: ?string;
    type: ?{name: string};
    optional?: boolean;
  }>;
  returns: ?{
    description: ?string;
    type: ?{name: string};
  };
};

function getType(tag) {
  var res = null;
  if (!tag.type) {
    return null;
  } else if (typeof tag.type === "object"){
    res = getType(tag.type);
  } else if (tag.type === 'UnionType') {
    // union type
    res = {name: 'union', value: tag.elements.map(function (element) {
      return element.name;
    })};
  } else if (tag.type === 'AllLiteral') {
    // return {*}
    res =  {name: 'mixed'};
  }
  if (tag.expression) {
    // return {*}
    res = res || {};
    Object.assign(res, getType(tag.expression));
  }
  return res || {name: tag.name};
}

function getOptional(tag) {
  if (tag.type && tag.type.type && tag.type.type === 'OptionalType') {
    return true;
  }
  return;
}

function getRest(tag) {
    return (tag.type && tag.type.expression && tag.type.expression.type && tag.type.expression.type === 'RestType')
}

// Add jsdoc @return description.
function getReturnsJsDoc(jsDoc) {
  const returnTag = jsDoc.tags.find(
    tag => tag.title === 'return' || tag.title === 'returns'
  );
  if (returnTag) {
    return {
      description: returnTag.description,
      type: getType(returnTag),
    };
  }
  return null;
}

// Add jsdoc @param descriptions.
function getParamsJsDoc(jsDoc) {
  if (!jsDoc.tags) {
    return [];
  }
  return jsDoc.tags
    .filter(tag => tag.title === 'param')
    .map(tag => {
      return {
        name: tag.name,
        description: tag.description,
        type: getType(tag),
        optional: getOptional(tag),
        rest: getRest(tag)
      };
    });
}

export default function parseJsDoc(docblock: string): JsDoc {
  const jsDoc = doctrine.parse(docblock,{sloppy:true});
  return {
    description: jsDoc.description || null,
    params: getParamsJsDoc(jsDoc),
    returns: getReturnsJsDoc(jsDoc),
  };
}
