import React from 'react';

interface Props {
  /** description of value */
  value: string;
}

export default class MyComponent extends withFoo(React.Component) {
  props: Props;
  render() {
    return <div />;
  }
}
