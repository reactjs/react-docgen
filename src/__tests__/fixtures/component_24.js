/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { Component } from 'react';

interface BaseProps {
  /** Optional prop */
  foo?: string,
  /** Required prop */
  bar: number
}

type TransitionDuration = number | { enter?: number, exit?: number } | 'auto';

interface Props extends BaseProps, OtherProps {
  /** Complex union prop */
  baz: TransitionDuration
}

/**
 * This is a flow class component with an interface as props
 */
export default class FlowComponent extends Component<Props> {
  render() {
    return <h1>Hello world</h1>;
  }
}
