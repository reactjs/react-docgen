/**
 * @flow
 */

import React, { Component } from 'react';
import type { Props as ImportedProps } from './flow-export-type.js';

export type ExtendedProps = {
  ...ImportedProps,
  bar: number
}

/**
 * This is a Flow component with imported prop types
 */
export function ImportedComponent(props: ImportedProps) {
  return <h1>Hello world</h1>;
}
