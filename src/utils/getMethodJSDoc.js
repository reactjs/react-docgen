/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import doctrine from 'doctrine';

import {getDocblock} from './docblock';

type Tag = {
  title: string;
  access: string;
  description: string;
  name: string;
};

export type MethodJSDoc = {
  description: ?string;
  tags: [Tag];
};

export default function(methodPath: NodePath): ?MethodJSDoc {
  const docBlock = getDocblock(methodPath);
  if (docBlock) {
    return doctrine.parse(docBlock);
  }
  return null;
}
