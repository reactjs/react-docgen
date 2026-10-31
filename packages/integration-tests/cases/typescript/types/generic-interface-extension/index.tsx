import React, { Component } from 'react';

type Test<X> = Array<X>;
interface BaseProps<T> {
  /** Optional prop */
  foo?: T,
  /** Required prop */
  bar: Test<T>
}

interface Child {}

interface Props extends BaseProps<Child> {
  /** Complex union prop */
  baz: number
}

/**
 * This is a typescript class component
 */
export default class TSComponent extends Component<Props> {
  render() {
    return <h1>Hello world</h1>;
  }
}
