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
 * Testing computed argument passed to shape()
 */

import React from 'react';

var pt = React.PropTypes;

class Parent extends React.Component {
  static propTypes = {
    something: pt.string.isRequired,
    child: pt.shape(Child.propTypes).isRequired,
    extendedChild: pt.shape({
      ...Child.propTypes,
      adopted: pt.bool.isRequired
    }).isRequired,
    childExact: pt.exact(Child.propTypes).isRequired,
    extendedChildExact: pt.exact({
      ...Child.propTypes,
      adopted: pt.bool.isRequired
    }).isRequired
  };
}

export default Parent;
