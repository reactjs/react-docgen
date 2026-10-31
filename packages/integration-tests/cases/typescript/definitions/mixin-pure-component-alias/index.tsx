import { PureComponent as Base } from 'react';

interface Props {
  /** description of value */
  value: string;
  enabled?: boolean;
}

export default class MyComponent extends withFoo(Base<Props>) {
  render() {
    return <div />;
  }
}
