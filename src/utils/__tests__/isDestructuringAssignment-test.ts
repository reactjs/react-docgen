import { parse } from '../../../tests/utils';
import isDestructuringAssignment from '../isDestructuringAssignment';

describe('isDestructuringAssignment', () => {
  it('detects destructuring', () => {
    const def = parse(`
      var { Component } = require('react');
    `).get('body', 0, 'declarations', 0, 'id', 'properties', 0, 'key');

    expect(isDestructuringAssignment(def, 'Component')).toBe(true);
  });

  it('fails if name does not match', () => {
    const def = parse(`
      var { Component } = require('react');
    `).get('body', 0, 'declarations', 0, 'id', 'properties', 0, 'key');

    expect(isDestructuringAssignment(def, 'Component2')).toBe(false);
  });

  it('detects destructuring with alias', () => {
    const def = parse(`
      var { Component: C } = require('react');
    `).get('body', 0, 'declarations', 0, 'id', 'properties', 0, 'value');

    expect(isDestructuringAssignment(def, 'Component')).toBe(true);
  });

  it('fails if name does not match with alias', () => {
    const def = parse(`
      var { Component: C } = require('react');
    `).get('body', 0, 'declarations', 0, 'id', 'properties', 0, 'value');

    expect(isDestructuringAssignment(def, 'Component2')).toBe(false);
  });
});
