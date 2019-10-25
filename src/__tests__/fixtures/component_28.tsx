/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

interface Props {
  /**
   * Example prop description
   */
  foo: boolean;
}

/**
 * Example component description
 */
const Component = React.forwardRef(({ foo = true }: Props, ref: any) => {
  return <div />;
})

Component.displayName = 'ABC';

export default Component;
