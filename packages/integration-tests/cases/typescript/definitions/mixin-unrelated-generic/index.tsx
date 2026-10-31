import React from 'react';

interface Props {
  /** description of value */
  value: string;
}

interface Options {
  unrelated: number;
}
function configure<T>() {
  return {};
}
function makeComponent(_configuration: unknown) {
  return React.Component<Props>;
}

export default class MyComponent extends makeComponent(configure<Options>) {
  props: Props;
  render() {
    return <div />;
  }
}
