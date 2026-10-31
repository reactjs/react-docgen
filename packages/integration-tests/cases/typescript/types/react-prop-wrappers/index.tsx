import type * as React from 'react';

interface Props {
  /** Required label. */
  label: string;
}

/** Exercises nested built-in React prop wrappers. */
export function WrappedPropsComponent(
  _props: React.PropsWithChildren<
    React.PropsWithRef<React.PropsWithoutRef<Props>>
  >,
) {
  return <div />;
}
