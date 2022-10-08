import React from 'react';

type Props = {
  align?: "left" | "center" | "right" | "justify",
  left?: boolean,
  center?: boolean,
  right?: boolean,
  justify?: boolean,
  /**
   * position doc
   */
  position: {
    /**
     * x coordinate doc
     */
    x: number,
    /**
     * y coordinate doc
     */
    y: number
  }
};

/**
 * This is a TypeScript function component
 */
export function TSFunctionComponent(props: Props) {
  return <h1>Hello world</h1>;
}
