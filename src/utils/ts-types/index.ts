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
    getOwnTypeBinding(name: string): TypeBinding;
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
    // TODO fix DT and remove existing from params
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
  const ids = { [path.node.name]: [path.node] };
  // TODO remove loop as always one identifier?
  for (const name of Object.keys(ids)) {
    for (const id of ids[name]) {
      const local = this.getOwnTypeBinding(name);

      if (local) {
        if (local.identifier === id) continue;

        if (
          // <!>: collide, <=>: not collide, merge
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
        // TODO fix in DT
        // this.checkBlockScopedCollisions(local as any, 'let', name, id);
      }

      if (local) {
        // two interface with the same name
        // @ts-expect-error TODO fix DT
        local.reassign(path);
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

function getOwnTypeBinding(this: BaseScope, name: string): TypeBinding {
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
  // @ts-expect-error The typ does not allow undefined, only internally
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
