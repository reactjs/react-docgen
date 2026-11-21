import React from 'react';

interface Props {
  /**
   * description of foo
   */
  foo: string;
  bar?: number;
}

/**
 * Props are only defined through the generic type argument of React.memo.
 */
const MyComponent = React.memo<Props>((props) => <div />);

export default MyComponent;
