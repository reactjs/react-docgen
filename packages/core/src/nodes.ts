import type { AstNode } from './AstNode.js';

export interface RangedNode extends AstNode {
  readonly range: readonly [number, number];
}

export interface Identifier extends RangedNode {
  readonly type: 'Identifier';
  readonly name: string;
  readonly typeAnnotation?: TSTypeAnnotation;
}

export interface Program extends RangedNode {
  readonly type: 'Program';
  readonly body: AstNode[];
  readonly comments?: Comment[];
}

export interface Comment extends RangedNode {
  readonly type: 'Block' | 'Line';
  readonly value: string;
}

export interface ExportNamedDeclaration extends RangedNode {
  readonly type: 'ExportNamedDeclaration';
  readonly declaration: AstNode | null;
}

export interface FunctionDeclaration extends RangedNode {
  readonly type: 'FunctionDeclaration';
  readonly id: Identifier | null;
  readonly params: AstNode[];
}

export interface ObjectPattern extends RangedNode {
  readonly type: 'ObjectPattern';
  readonly properties: AstNode[];
  readonly typeAnnotation?: TSTypeAnnotation;
}

export interface Property extends RangedNode {
  readonly type: 'Property';
  readonly key: AstNode;
  readonly value: AstNode;
}

export interface AssignmentPattern extends RangedNode {
  readonly type: 'AssignmentPattern';
  readonly left: AstNode;
  readonly right: AstNode;
}

export interface Literal extends RangedNode {
  readonly type: 'Literal';
  readonly raw?: string;
  readonly value: boolean | number | string | null;
}

export interface TSTypeAliasDeclaration extends RangedNode {
  readonly type: 'TSTypeAliasDeclaration';
  readonly id: Identifier;
  readonly typeAnnotation: AstNode;
}

export interface TSTypeAnnotation extends RangedNode {
  readonly type: 'TSTypeAnnotation';
  readonly typeAnnotation: AstNode;
}

export interface TSTypeReference extends RangedNode {
  readonly type: 'TSTypeReference';
  readonly typeName: AstNode;
}

export interface TSTypeLiteral extends RangedNode {
  readonly type: 'TSTypeLiteral';
  readonly members: AstNode[];
}

export interface TSPropertySignature extends RangedNode {
  readonly type: 'TSPropertySignature';
  readonly key: AstNode;
  readonly optional: boolean;
  readonly typeAnnotation?: TSTypeAnnotation;
}

export interface TSBooleanKeyword extends RangedNode {
  readonly type: 'TSBooleanKeyword';
}

export interface TSStringKeyword extends RangedNode {
  readonly type: 'TSStringKeyword';
}
