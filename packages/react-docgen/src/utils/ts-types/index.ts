import type { NodePath } from '@babel/traverse';
import { Scope as BaseScope } from '@babel/traverse';
import type {
  Identifier,
  TSEnumDeclaration,
  TSInterfaceDeclaration,
  TSTypeAliasDeclaration,
} from '@babel/types';

type BindingNode =
  | TSEnumDeclaration
  | TSInterfaceDeclaration
  | TSTypeAliasDeclaration;

type TypeKind = 'alias' | 'enum' | 'interface';

/**
 * What the f... is this?
 * Well, babel and in particular @babel/traverse have no scope tracking
 * for typescript types. Flow types do work because they are part of the
 * normal reference tracking and mix with non-type identifiers.
 * This monkey-patching of @babel/traverse adds scope tracking for
 * typescript types. It tries to do this without changing any babel behavior.
 *
 * This is not the best solution, but it allows to use @babel/traverse in react-docgen
 * which needs to be able to do scope tracking of typescript types.
 *
 * see https://github.com/babel/babel/issues/14662
 */

declare module '@babel/traverse' {
  export interface Scope {
    typeBindings: Record<string, TypeBinding>;
    getTypeBinding(name: string): TypeBinding | undefined;
    getOwnTypeBinding(name: string): TypeBinding | undefined;
    registerTypeBinding(
      this: BaseScope,
      typeKind: TypeKind,
      path: NodePath<Identifier>,
      bindingPath: NodePath<BindingNode>,
    ): void;
    _realRegisterDeclaration: BaseScope['registerDeclaration'];
    _realCrawl: BaseScope['crawl'];
  }
}

class TypeBinding {
  identifier: Identifier;
  identifierPath: NodePath<Identifier>;
  path: NodePath;
  scope: BaseScope;
  typeKind: TypeKind;

  constructor(data: {
    identifier: Identifier;
    identifierPath: NodePath<Identifier>;
    path: NodePath;
    scope: BaseScope;
    typeKind: TypeKind;
  }) {
    this.identifier = data.identifier;
    this.identifierPath = data.identifierPath;
    this.path = data.path;
    this.scope = data.scope;
    this.typeKind = data.typeKind;
  }
}

function registerTypeBinding(
  this: BaseScope,
  typeKind: TypeKind,
  path: NodePath<Identifier>,
  bindingPath: NodePath<BindingNode>,
): void {
  const id = path.node;
  const { name } = id;
  const local = this.getOwnTypeBinding(name);

  if (local) {
    if (local.identifier === id) return;

    if (
      // <!>: does collide,
      // <=>: does not collide (type merging)
      //
      // enum <!> interface
      // enum <!> alias
      // interface <!> alias
      // alias <!> alias
      // interface <=> interface
      // enum <=> enum
      typeKind !== local.typeKind ||
      typeKind === 'alias' ||
      local.typeKind === 'alias'
    ) {
      throw this.hub.buildError(
        id,
        `Duplicate type declaration "${name}"`,
        TypeError,
      );
    }
  } else {
    this.typeBindings[name] = new TypeBinding({
      identifier: id,
      identifierPath: path,
      path: bindingPath,
      scope: this,
      typeKind,
    });
  }
}

function getTypeBinding(
  this: BaseScope,
  name: string,
): TypeBinding | undefined {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  let scope = this;

  do {
    const binding = scope.getOwnTypeBinding(name);

    if (binding) {
      return binding;
    }
  } while ((scope = scope.parent));

  return undefined;
}

function getOwnTypeBinding(
  this: BaseScope,
  name: string,
): TypeBinding | undefined {
  return this.typeBindings[name];
}

function registerDeclaration(this: BaseScope, path: NodePath): void {
  if (path.isTSTypeAliasDeclaration()) {
    this.registerTypeBinding('alias', path.get('id'), path);
  } else if (path.isTSInterfaceDeclaration()) {
    this.registerTypeBinding('interface', path.get('id'), path);
  } else if (path.isTSEnumDeclaration()) {
    this.registerTypeBinding('enum', path.get('id'), path);
  } else {
    this._realRegisterDeclaration(path);
  }
}

export default function initialize(scopeClass: typeof BaseScope): void {
  // @ts-expect-error The typ assumes getTypeBinding is always set,
  // but we know we have to do that once and that is here
  if (scopeClass.prototype.getTypeBinding) {
    return;
  }
  scopeClass.prototype.getTypeBinding = getTypeBinding;
  scopeClass.prototype.registerTypeBinding = registerTypeBinding;
  scopeClass.prototype.getOwnTypeBinding = getOwnTypeBinding;

  scopeClass.prototype._realRegisterDeclaration =
    scopeClass.prototype.registerDeclaration;
  scopeClass.prototype.registerDeclaration = registerDeclaration;

  scopeClass.prototype._realCrawl = scopeClass.prototype.crawl;
  scopeClass.prototype.crawl = function (this: BaseScope) {
    this.typeBindings = Object.create(null);
    this._realCrawl();
  };
}

initialize(BaseScope);
