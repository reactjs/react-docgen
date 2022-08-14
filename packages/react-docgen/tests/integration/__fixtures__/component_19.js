import React from 'react';

type Props = {|
  data?: Array<mixed>,
  ...React.ElementConfig<typeof SomeOtherComponent>,
|};

type State = {|
  width: number,
|};

export default class Component extends React.PureComponent<Props, State> {
  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    doSomething();
  }

  render() {
    return (
      <div>Hello</div>
    );
  }
}
