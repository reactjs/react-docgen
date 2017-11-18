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

function postProcessProps(props) {
  // props with default values should not be required
  Object.keys(props).forEach(prop => {
    const propInfo = props[prop];

    if (propInfo.defaultValue) {
      propInfo.required = false;

      // Check and remove any flow type cast.  Use last `:` in case description has `:` in it.
      propInfo.defaultValue.value = propInfo.defaultValue.value.includes(':') ?
        propInfo.defaultValue.value.slice(0, propInfo.defaultValue.value.lastIndexOf(':')) :
        propInfo.defaultValue.value
    }
  });
}

export default function (documentation: any) {
  const props = documentation.props;
  if (props) {
    postProcessProps(props);
  }

  return documentation;
}
