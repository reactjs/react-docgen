/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

import type Documentation from './Documentation';

export type PropTypeDescriptor = {
  name:
    | 'arrayOf'
    | 'custom'
    | 'enum'
    | 'array'
    | 'bool'
    | 'func'
    | 'number'
    | 'object'
    | 'string'
    | 'any'
    | 'element'
    | 'node'
    | 'symbol'
    | 'objectOf'
    | 'shape'
    | 'exact'
    | 'union'
    | 'elementType',
  value?: any,
  raw?: string,
  computed?: boolean,
  // These are only needed for shape/exact types.
  // Consider consolidating PropTypeDescriptor and PropDescriptor
  description?: string,
  required?: boolean,
};

export type FlowBaseType = {
  required?: boolean,
  nullable?: boolean,
  alias?: string,
};

export type FlowSimpleType = FlowBaseType & {|
  name: string,
  raw?: string,
|};

export type FlowLiteralType = FlowBaseType & {
  name: 'literal',
  value: string,
};

export type FlowElementsType = FlowBaseType & {
  name: string,
  raw: string,
  elements: Array<FlowTypeDescriptor>,
};

export type FlowFunctionSignatureType = FlowBaseType & {
  name: 'signature',
  type: 'function',
  raw: string,
  signature: {
    arguments: Array<{ name: string, type: FlowTypeDescriptor }>,
    return: FlowTypeDescriptor,
  },
};

export type FlowObjectSignatureType = FlowBaseType & {
  name: 'signature',
  type: 'object',
  raw: string,
  signature: {
    properties: Array<{
      key: string | FlowTypeDescriptor,
      value: FlowTypeDescriptor,
    }>,
    constructor?: FlowTypeDescriptor,
  },
};

export type FlowTypeDescriptor =
  | FlowSimpleType
  | FlowLiteralType
  | FlowElementsType
  | FlowFunctionSignatureType
  | FlowObjectSignatureType;

export type PropDescriptor = {
  type?: PropTypeDescriptor,
  flowType?: FlowTypeDescriptor,
  required?: boolean,
  defaultValue?: any,
  description?: string,
};

export type Handler = (documentation: Documentation, path: NodePath) => void;
export type Resolver = (
  node: ASTNode,
  recast: Recast,
) => ?NodePath | ?Array<NodePath>;
