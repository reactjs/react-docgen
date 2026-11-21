import React from 'react';

interface BaseProps {
  /**
   * inherited from the base interface
   */
  baseProp: string;
}

interface Props extends BaseProps {
  /**
   * description of foo
   */
  foo: string;
  bar?: number;
}

/**
 * Props are only defined through the React.FC type annotation,
 * not through the props argument (issue #387).
 */
const MyComponent: React.FC<Props> = () => <div />;

export default MyComponent;
