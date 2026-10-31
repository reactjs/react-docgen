import React from 'react';

interface Props {
  /** description of value */
  value: string;
}

export default class MyComponent extends withFoo(
  React.Component<
    React.PropsWithChildren<React.PropsWithRef<React.PropsWithoutRef<Props>>>
  >,
) {
  props: Props;
  render() {
    return <div />;
  }
}
