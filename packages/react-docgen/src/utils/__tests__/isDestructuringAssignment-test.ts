import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import { parse } from '../../../tests/utils';
import isDestructuringAssignment from '../isDestructuringAssignment.js';
import { describe, expect, test } from 'vitest';

describe('isDestructuringAssignment', () => {
  test('detects destructuring', () => {
    const def = parse(`
      var { Component } = require('react');
    `).get('body.0.declarations.0.id.properties.0') as NodePath<Node>;

    expect(isDestructuringAssignment(def, 'Component')).toBe(true);
  });

  test('fails if name does not match', () => {
    const def = parse(`
      var { Component } = require('react');
    `).get('body.0.declarations.0.id.properties.0') as NodePath<Node>;

    expect(isDestructuringAssignment(def, 'Component2')).toBe(false);
  });

  test('detects destructuring with alias', () => {
    const def = parse(`
      var { Component: C } = require('react');
    `).get('body.0.declarations.0.id.properties.0') as NodePath<Node>;

    expect(isDestructuringAssignment(def, 'Component')).toBe(true);
  });

  test('fails if name does not match with alias', () => {
    const def = parse(`
      var { Component: C } = require('react');
    `).get('body.0.declarations.0.id.properties.0') as NodePath<Node>;

    expect(isDestructuringAssignment(def, 'Component2')).toBe(false);
  });
});
