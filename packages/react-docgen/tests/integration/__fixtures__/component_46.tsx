import React from 'react';

interface Props {
  /**
   * description of foo
   */
  foo: string;
}

function InnerComponent() {
  return <div />;
}

/**
 * The component is a named function assigned to a variable annotated
 * with React.FC<Props> (issue #387).
 */
const MyComponent: React.FC<Props> = InnerComponent;

export default MyComponent;
