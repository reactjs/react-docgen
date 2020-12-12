/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { Component } from 'react';

export interface Props {
  foo: string
}

/**
 * This is a typescript class component
 */
export default class TSComponent extends Component<Props> {
  render() {
    return <h1>Hello world</h1>;
  }

  /**
   * This is a method
   */
  foo(a: string): string {
    return a;
  }

  /**
   * This is a public method
   */
  public bar(a: string): string {
    return a;
  }

  /**
   * This is a private method
   */
  private baz(a: string): string {
    return a;
  }
}
