import type AstPath from './AstPath.js';

export type BindingKind = 'type' | 'value';

export interface Binding {
  readonly kind: BindingKind;
  readonly name: string;
  readonly path: AstPath;
}

export default class Scope {
  readonly parent: Scope | null;

  readonly #bindings = {
    type: new Map<string, Binding>(),
    value: new Map<string, Binding>(),
  };

  constructor(parent?: Scope) {
    this.parent = parent ?? null;
  }

  declare(name: string, path: AstPath, kind: BindingKind = 'value'): Binding {
    const binding = { kind, name, path };

    this.#bindings[kind].set(name, binding);

    return binding;
  }

  getOwnBinding(name: string, kind: BindingKind = 'value'): Binding | null {
    return this.#bindings[kind].get(name) ?? null;
  }

  getBinding(name: string, kind: BindingKind = 'value'): Binding | null {
    return (
      this.getOwnBinding(name, kind) ??
      this.parent?.getBinding(name, kind) ??
      null
    );
  }
}
