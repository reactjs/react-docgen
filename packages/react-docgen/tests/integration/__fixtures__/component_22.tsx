import React from 'react';

type Props = {
  align?: "left" | "center" | "right" | "justify",
  left?: boolean,
  center?: boolean,
  right?: boolean,
  justify?: boolean,
};

/**
 * This is a TypeScript function component
 */
export function TSFunctionComponent(props: Props) {
  return <h1>Hello world</h1>;
}
