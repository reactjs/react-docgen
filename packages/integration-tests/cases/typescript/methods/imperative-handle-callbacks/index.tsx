import { memo, forwardRef, useCallback, useImperativeHandle } from 'react';

export const MyComponent = memo(
  forwardRef((_, ref) => {
    const _myMethod = useCallback((argument: string): number => 1, []);

    useImperativeHandle(
      ref,
      () => ({
        /** myMethod description */
        _myMethod,
      }),
      [],
    );

    return <div />;
  }),
);
