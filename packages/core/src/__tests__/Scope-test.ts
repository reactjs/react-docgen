import { describe, expect, test } from 'vitest';
import { AstPath, Scope } from '../index.js';

const path = new AstPath({ node: { type: 'Identifier', name: 'Props' } });

describe('Scope', () => {
  test('keeps value and type bindings separate', () => {
    const scope = new Scope();
    const value = scope.declare('Props', path);
    const type = scope.declare('Props', path, 'type');

    expect(scope.getBinding('Props')).toBe(value);
    expect(scope.getBinding('Props', 'type')).toBe(type);
    expect(scope.getBinding('missing')).toBeNull();
  });

  test('resolves and shadows parent bindings', () => {
    const parent = new Scope();
    const child = new Scope(parent);
    const parentBinding = parent.declare('Component', path);

    expect(child.getBinding('Component')).toBe(parentBinding);

    const childBinding = child.declare('Component', path);

    expect(child.getOwnBinding('Component')).toBe(childBinding);
    expect(child.getBinding('Component')).toBe(childBinding);
  });
});
