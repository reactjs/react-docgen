import React, { Component } from 'react';
import { Props as ImportedProps } from './component_27.jsx';

export default interface ExtendedProps extends ImportedProps {
  bar: number
}

/**
 * This is a typescript component with imported prop types
 */
export function ImportedComponent(props: ImportedProps) {
  return <h1>Hello world</h1>;
}
