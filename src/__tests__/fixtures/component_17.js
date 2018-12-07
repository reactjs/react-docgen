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
 * Testing descriptions of shape and oneOfType values
 */

import React from 'react';
import PropTypes from 'prop-types';

export default function Foo(props) {
  return <div />;
}

Foo.propTypes = {
  shapeProp: PropTypes.shape({
    /** Comment for property a */
    a: PropTypes.string,
    b: PropTypes.number
  }),
  oneOfTypeProp: PropTypes.oneOfType([
    /** Comment for type string */
    PropTypes.string,
    PropTypes.number
  ])
};
