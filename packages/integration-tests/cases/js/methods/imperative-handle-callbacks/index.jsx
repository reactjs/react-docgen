import React, {
  memo,
  forwardRef,
  useCallback as useCb,
  useImperativeHandle as useHandle,
} from 'react';

export const Input = memo(
  forwardRef(function Input(_props, ref) {
    const callback = (value = 'default') => value;
    const focus = useCb(callback, []);
    const reset = React.useCallback(() => {}, []);
    const save = useCb(async (value) => value, []);
    const values = useCb(function* () {
      yield 1;
    }, []);

    useHandle(ref, () => {
      const handle = {
        /** Focus the input. */
        focus,
        reset,
        save,
        values,
      };
      return handle;
    });

    return <input />;
  }),
);
