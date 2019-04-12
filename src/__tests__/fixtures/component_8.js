/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Testing array parameter destructuring.
 */

import React from 'react';

var pt = React.PropTypes;

class Parent extends React.Component {
  onChangeSlider([min, max]) {
    this.setState({ min, max });
  }
}

export default Parent;
