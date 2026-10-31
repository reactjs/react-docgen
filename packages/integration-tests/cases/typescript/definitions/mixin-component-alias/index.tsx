import { Component as Base } from 'react';

interface Props {
  /** description of value */
  value: string;
}

export default class MyComponent extends withFoo(Base<Props>) {
  render() {
    return <div />;
  }
}
