// @flow
import React from 'react';

interface Props {
  /**
   * description of foo
   */
  foo: string;
  bar?: number;
}

/**
 * Props are only defined through the React.FC type annotation
 * in flow-parsed code (issue #387).
 */
const MyComponent: React.FC<Props> = (props) => <div />;

export default MyComponent;
