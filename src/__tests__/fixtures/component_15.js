import type {Props as BarProps} from 'Bar.react';
import React from 'react';

const Bar = require('Bar.react');

type A = { other3: 'c' };
type B = $Exact<{ other4: 'g' }>;
type C = $Exact<$ReadOnly<{ other5: 'f' }>>;

type Props = {|
  ...$Exact<BarProps>,
  ...$Exact<$ReadOnly<BarProps2>>,
  ...BarProps3,
  ...{ other: 'a' },
  ...$Exact<{ other2: 'b' }>,
  ...A,
  ...B,
  ...C,
  somePropOverride: 'baz',
|};

export default class Foo extends React.Component<Props> {
  render() {
    return <Bar {...this.props} />;
  }
}