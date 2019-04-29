/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { Component } from 'react';
import { Props as ImportedProps } from './component_27';

export default interface ExtendedProps extends ImportedProps {
  bar: number
}

/**
 * This is a typescript component with imported prop types
 */
export function ImportedComponent(props: ImportedProps) {
  return <h1>Hello world</h1>;
}
