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

import type { DocumentationObject } from '../Documentation';

function postProcessProps(props) {
  // props with default values should not be required
  Object.keys(props).forEach(prop => {
    const propInfo = props[prop];

    if (propInfo.defaultValue) {
      propInfo.required = false;
    }
  });
}

export default function(documentation: DocumentationObject) {
  const props = documentation.props;

  if (props) {
    postProcessProps(props);
  }

  return documentation;
}
