import React from 'react';

interface Props {
  /**
   * Example prop description
   */
  foo: boolean;
}

/**
 * Example component description
 */
const Component = React.forwardRef(({ foo = true }: Props, ref: any) => {
  return <div />;
})

Component.displayName = 'ABC';

export default Component;
