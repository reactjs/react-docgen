/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Documentation from './Documentation';
import { type Parser } from './babelParser';

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

export type FlowSimpleType = $Exact<
  FlowBaseType & {
    name: string,
    raw?: string,
  },
>;

export type FlowLiteralType = FlowBaseType & {
  name: 'literal',
  value: string,
};

export type FlowElementsType = FlowBaseType & {
  name: string,
  raw: string,
  elements: Array<FlowTypeDescriptor>,
};

export type FlowFunctionArgumentType = {
  name: string,
  type?: FlowTypeDescriptor,
  rest?: boolean,
};

export type FlowFunctionSignatureType = FlowBaseType & {
  name: 'signature',
  type: 'function',
  raw: string,
  signature: {
    arguments: Array<FlowFunctionArgumentType>,
    return: FlowTypeDescriptor,
  },
};

export type TSFunctionSignatureType = FlowBaseType & {
  name: 'signature',
  type: 'function',
  raw: string,
  signature: {
    arguments: Array<FlowFunctionArgumentType>,
    return: FlowTypeDescriptor,
    this?: FlowTypeDescriptor,
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
  tsType?: FlowTypeDescriptor,
  required?: boolean,
  defaultValue?: any,
  description?: string,
};

export type Importer = (path: NodePath, name: string) => ?NodePath;

export type Handler = (
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
) => void;
export type Resolver = (
  node: ASTNode,
  parser: Parser,
  importer: Importer,
) => ?NodePath | ?Array<NodePath>;
