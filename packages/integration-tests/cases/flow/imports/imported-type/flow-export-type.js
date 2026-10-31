/**
 * @flow
 */

import React, { Component } from 'react';

export type Props = {
  foo: string
}

/**
 * This is a Flow class component
 */
export default class FlowComponent extends Component<Props> {
  render() {
    return <h1>Hello world</h1>;
  }

  foo(a: string): string {
    return a;
  }

  bar(a: string): string {
    return a;
  }
}
