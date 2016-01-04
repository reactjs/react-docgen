/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

import type Documentation from '../src/Documentation';

type PropTypeDescriptor = {
  name: string;
  value?: any;
  raw?: string;
  computed?: boolean;
  // These are only needed for shape types.
  // Consider consolidating PropTypeDescriptor and PropDescriptor
  description?: string;
  required?: boolean;
};

type PropDescriptor = {
  type?: PropTypeDescriptor;
  required?: boolean;
  defaultValue?: any;
  description?: string;
};

type Handler = (documentation: Documentation, path: NodePath) => void;
type Resolver =
  (node: ASTNode, recast: Recast) => (?NodePath|?Array<NodePath>);
