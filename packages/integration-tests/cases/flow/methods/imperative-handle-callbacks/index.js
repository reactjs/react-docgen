import * as React from 'react';

export const Input = React.forwardRef((_, ref) => {
  const focus = React.useCallback((value: string): number => 1, []);
  React.useImperativeHandle(ref, () => ({
    /** Focus the input. */
    focus,
  }));
  return <input />;
});
