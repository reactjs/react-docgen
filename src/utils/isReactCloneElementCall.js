/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import isReactBuiltinCall from './isReactBuiltinCall';
import type { Importer } from '../types';

/**
 * Returns true if the expression is a function call of the form
 * `React.cloneElement(...)`.
 */
export default function isReactCloneElementCall(
  path: NodePath,
  importer: Importer,
): boolean {
  return isReactBuiltinCall(path, 'cloneElement', importer);
}
