import React, { forwardRef, useImperativeHandle } from 'react';

export const Input = forwardRef(function Input(_props, ref) {
  useImperativeHandle(ref, () => ({
    /** Focus the input. */
    focus() {},
    /** Reset its value. */
    reset: function reset() {},
  }));

  return <input ref={ref} />;
});
