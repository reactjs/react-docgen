import findAllComponentDefinitions from './findAllComponentDefinitions.js';
import findAllExportedComponentDefinitions from './findAllExportedComponentDefinitions.js';
import findExportedComponentDefinition from './findExportedComponentDefinition.js';
import type { NodePath } from '@babel/traverse';
import type FileState from '../FileState.js';
import type {
  ArrowFunctionExpression,
  CallExpression,
  ClassDeclaration,
  ClassExpression,
  FunctionDeclaration,
  FunctionExpression,
  ObjectExpression,
  ObjectMethod,
} from '@babel/types';

export type StatelessComponentNode =
  | ArrowFunctionExpression
  | FunctionDeclaration
  | FunctionExpression
  | ObjectMethod;

export type ComponentNode =
  | CallExpression
  | ClassDeclaration
  | ClassExpression
  | ObjectExpression
  | StatelessComponentNode;

export type Resolver = (file: FileState) => Array<NodePath<ComponentNode>>;

export {
  findAllComponentDefinitions,
  findAllExportedComponentDefinitions,
  findExportedComponentDefinition,
};
