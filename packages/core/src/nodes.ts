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

export interface ExportDefaultDeclaration extends RangedNode {
  readonly type: 'ExportDefaultDeclaration';
  readonly declaration: AstNode;
}

export interface ExpressionStatement extends RangedNode {
  readonly type: 'ExpressionStatement';
  readonly expression: AstNode;
}

export interface AssignmentExpression extends RangedNode {
  readonly type: 'AssignmentExpression';
  readonly left: AstNode;
  readonly operator: string;
  readonly right: AstNode;
}

export interface CallExpression extends RangedNode {
  readonly type: 'CallExpression';
  readonly arguments: AstNode[];
  readonly callee: AstNode;
}

export interface ArrayExpression extends RangedNode {
  readonly type: 'ArrayExpression';
  readonly elements: Array<AstNode | null>;
}

export interface MemberExpression extends RangedNode {
  readonly type: 'MemberExpression';
  readonly computed: boolean;
  readonly object: AstNode;
  readonly property: AstNode;
}

export interface FunctionDeclaration extends RangedNode {
  readonly type: 'FunctionDeclaration';
  readonly id: Identifier | null;
  readonly params: AstNode[];
}

export interface FunctionExpression extends RangedNode {
  readonly type: 'FunctionExpression';
  readonly id: Identifier | null;
  readonly params: AstNode[];
  readonly body: AstNode;
  readonly async?: boolean;
  readonly generator?: boolean;
  readonly returnType?: TSTypeAnnotation;
}

export interface ArrowFunctionExpression extends RangedNode {
  readonly type: 'ArrowFunctionExpression';
  readonly params: AstNode[];
  readonly body: AstNode;
  readonly async?: boolean;
  readonly returnType?: TSTypeAnnotation;
}

export interface VariableDeclaration extends RangedNode {
  readonly type: 'VariableDeclaration';
  readonly declarations: AstNode[];
}

export interface VariableDeclarator extends RangedNode {
  readonly type: 'VariableDeclarator';
  readonly id: AstNode;
  readonly init: AstNode | null;
}

export interface ClassDeclaration extends RangedNode {
  readonly type: 'ClassDeclaration';
  readonly body: ClassBody;
  readonly id: Identifier | null;
  readonly superTypeArguments?: TSTypeParameterInstantiation;
}

export interface ClassExpression extends RangedNode {
  readonly type: 'ClassExpression';
  readonly body: ClassBody;
  readonly id: Identifier | null;
  readonly superTypeArguments?: TSTypeParameterInstantiation;
}

export interface ClassBody extends RangedNode {
  readonly type: 'ClassBody';
  readonly body: AstNode[];
}

export interface PropertyDefinition extends RangedNode {
  readonly type: 'PropertyDefinition';
  readonly computed: boolean;
  readonly key: AstNode;
  readonly static: boolean;
  readonly value: AstNode | null;
}

export interface MethodDefinition extends RangedNode {
  readonly type: 'MethodDefinition';
  readonly computed: boolean;
  readonly key: AstNode;
  readonly kind: 'constructor' | 'get' | 'method' | 'set';
  readonly static: boolean;
  readonly value: FunctionExpression;
}

export interface BlockStatement extends RangedNode {
  readonly type: 'BlockStatement';
  readonly body: AstNode[];
}

export interface ReturnStatement extends RangedNode {
  readonly type: 'ReturnStatement';
  readonly argument: AstNode | null;
}

export interface ObjectPattern extends RangedNode {
  readonly type: 'ObjectPattern';
  readonly properties: AstNode[];
  readonly typeAnnotation?: TSTypeAnnotation;
}

export interface Property extends RangedNode {
  readonly type: 'Property';
  readonly computed?: boolean;
  readonly key: AstNode;
  readonly value: AstNode;
}

export interface ObjectExpression extends RangedNode {
  readonly type: 'ObjectExpression';
  readonly properties: AstNode[];
}

export interface SpreadElement extends RangedNode {
  readonly type: 'SpreadElement';
  readonly argument: AstNode;
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

export interface TSInterfaceBody extends RangedNode {
  readonly type: 'TSInterfaceBody';
  readonly body: AstNode[];
}

export interface TSInterfaceDeclaration extends RangedNode {
  readonly type: 'TSInterfaceDeclaration';
  readonly body: TSInterfaceBody;
  readonly id: Identifier;
}

export interface TSTypeParameterInstantiation extends RangedNode {
  readonly type: 'TSTypeParameterInstantiation';
  readonly params: AstNode[];
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
