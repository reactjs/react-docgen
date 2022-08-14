import React from 'react';
import { objDestruct, defaultFrom } from './support/some-exports';

/**
 * This is a TS component with imported stuff
 */
export function ImportedExtendedComponent({ x = objDestruct, y = defaultFrom }) {
  return <h1>Hello world</h1>;
}
