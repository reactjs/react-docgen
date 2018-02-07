/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * Test for documentation of React components with Flow annotations for props.
 */

import React from 'react';

type Props = {
   prop1: string,
   prop2: string,
};

class Foo extends React.Component<Props> {
   render() {
       return (
           <div>
               {this.props.prop1}
               I am Foo!
               {this.props.prop2}
           </div>
       );
   }
}

Foo.defaultProps = {
   prop2: 'bar',
};

export default Foo;