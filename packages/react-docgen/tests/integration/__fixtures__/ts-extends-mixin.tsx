import React from 'react';

interface Props {
  /**
   * description of value
   */
  value: string;
}

function withFoo<T extends new (...args: any[]) => React.Component<any>>(
  Base: T,
) {
  return class extends Base {};
}

export default class MyComponent extends withFoo(React.Component<Props>) {
  render() {
    return <div />;
  }
}
