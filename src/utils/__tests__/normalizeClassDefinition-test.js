/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global describe, beforeEach, it, expect*/

describe('normalizeClassDefinition', () => {
  var parse;
  var normalizeClassDefinition;

  beforeEach(() => {
    ({parse} = require('../../../tests/utils'));
    normalizeClassDefinition = require('../normalizeClassDefinition').default;
  });

  it('finds assignments to class declarations', () => {
    var classDefinition = parse(`
      class Foo {}
      Foo.propTypes = 42;
    `).get('body', 0);

    normalizeClassDefinition(classDefinition);
    var {node: {body: {body: [classProperty]}}} = classDefinition;
    expect(classProperty).toBeDefined();
    expect(classProperty.key.name).toBe('propTypes');
    expect(classProperty.value.value).toBe(42);
    expect(classProperty.static).toBe(true);
  });

  it('finds assignments to class expressions', () => {
    var classDefinition = parse(`
      var Foo = class {};
      Foo.propTypes = 42;
    `).get('body', 0, 'declarations', 0, 'init');

    normalizeClassDefinition(classDefinition);
    var {node: {body: {body: [classProperty]}}} = classDefinition;
    expect(classProperty).toBeDefined();
    expect(classProperty.key.name).toBe('propTypes');
    expect(classProperty.value.value).toBe(42);
    expect(classProperty.static).toBe(true);

    classDefinition = parse(`
      var Foo;
      Foo = class {};
      Foo.propTypes = 42;
    `).get('body', 1, 'expression', 'right');

    normalizeClassDefinition(classDefinition);
    ({node: {body: {body: [classProperty]}}} = classDefinition);
    expect(classProperty).toBeDefined();
  });

  it('ignores assignments further up the tree', () => {
    var classDefinition = parse(`
      var Foo = function() {
        (class {});
      };
      Foo.bar = 42;
    `)
    .get('body', 0, 'declarations', 0, 'init', 'body', 'body', '0', 'expression');

    normalizeClassDefinition(classDefinition);
    var {node: {body: {body: [classProperty]}}} = classDefinition;
    expect(classProperty).not.toBeDefined();
  });
});
