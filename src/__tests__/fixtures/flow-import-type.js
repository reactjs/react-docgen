/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, { Component } from 'react';
import type { Props as ImportedProps } from './flow-export-type';

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
