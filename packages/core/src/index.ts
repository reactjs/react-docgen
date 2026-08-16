export { default as AstPath } from './AstPath.js';
export { isAstNode } from './AstNode.js';
export { default as extract } from './extract.js';
export * from './guards.js';
export { FileState, default as ProjectContext } from './ProjectContext.js';
export { default as Scope } from './Scope.js';
export { default as traverse } from './traverse.js';

export type { AstNode, VisitorKeys } from './AstNode.js';
export type {
  ComponentDocumentation,
  DefaultValueDescriptor,
  Handler,
  PropDescriptor,
  Resolver,
  TypeDescriptor,
} from './extract.js';
export type * from './nodes.js';
export type {
  Importer,
  Parser,
  ParserSelector,
  SourceFile,
} from './ProjectContext.js';
export type { Binding, BindingKind } from './Scope.js';
export type {
  Visit,
  Visitor,
  VisitorEntry,
  VisitorHandler,
} from './traverse.js';
