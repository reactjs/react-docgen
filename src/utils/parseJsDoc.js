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
  if (!tag.type) {
    return null;
  } else if (tag.type.type === 'UnionType') {
    // union type
    return {name: 'union', value: tag.type.elements.map(function (element) {
      return element.name;
    })};
  } else if (tag.type.type === 'AllLiteral') {
    // return {*}
    return {name: 'mixed'};
  }
  return {name: tag.type.name ? tag.type.name : tag.type.expression.name};
}

function getOptional(tag) {
  if (tag.type && tag.type.type && tag.type.type === 'OptionalType') {
    return true;
  }
  return;
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
      };
    });
}

export default function parseJsDoc(docblock: string): JsDoc {
  const jsDoc = doctrine.parse(docblock);

  return {
    description: jsDoc.description || null,
    params: getParamsJsDoc(jsDoc),
    returns: getReturnsJsDoc(jsDoc),
  };
}
