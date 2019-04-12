/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

export default function(
  documentation: DocumentationObject,
): DocumentationObject {
  const props = documentation.props;

  if (props) {
    postProcessProps(props);
  }

  return documentation;
}
