/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('../../Documentation');

import { parse } from '../../../tests/utils';

describe('defaultPropsHandler', () => {
  let documentation;
  let defaultPropsHandler;

  beforeEach(() => {
    documentation = new (require('../../Documentation'))();
    defaultPropsHandler = require('../defaultPropsHandler').default;
  });

  describe('ObjectExpression', () => {
    it('should find prop default values that are literals', () => {
      const src = `
        ({
          getDefaultProps: function() {
            return {
              foo: "bar",
              bar: 42,
              baz: ["foo", "bar"],
              abc: {xyz: abc.def, 123: 42}
            };
          }
        })
      `;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 0, 'expression'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('handles computed properties', () => {
      const src = `
        ({
          getDefaultProps: function() {
            return {
              foo: "bar",
              [bar]: 42,
            };
          }
        })
      `;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 0, 'expression'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('ignores complex computed properties', () => {
      const src = `
        ({
          getDefaultProps: function() {
            return {
              foo: "bar",
              [() => {}]: 42,
            };
          }
        })
      `;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 0, 'expression'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });

  describe('ClassDeclaration with static defaultProps', () => {
    it('should find prop default values that are literals', () => {
      const src = `
        class Foo {
          static defaultProps = {
            foo: "bar",
            bar: 42,
            baz: ["foo", "bar"],
            abc: {xyz: abc.def, 123: 42}
          };
        }
      `;
      defaultPropsHandler(documentation, parse(src).get('body', 0));
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('should find prop default values that are imported variables', () => {
      const src = `
        import ImportedComponent from './ImportedComponent';

        class Foo {
          static defaultProps = {
            foo: ImportedComponent,
          };
        }
      `;
      defaultPropsHandler(documentation, parse(src).get('body', 1));
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });

  describe('ClassExpression with static defaultProps', () => {
    it('should find prop default values that are literals', () => {
      const src = `
        var Bar = class {
          static defaultProps = {
            foo: "bar",
            bar: 42,
            baz: ["foo", "bar"],
            abc: {xyz: abc.def, 123: 42}
          };
      }`;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 0, 'declarations', 0, 'init'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });

  it('should only consider Property nodes, not e.g. spread properties', () => {
    const src = `
      ({
        getDefaultProps: function() {
          return {
            ...Foo.bar,
            bar: 42,
          };
        }
      })
    `;
    const definition = parse(src).get('body', 0, 'expression');
    expect(() => defaultPropsHandler(documentation, definition)).not.toThrow();
    expect(documentation.descriptors).toMatchSnapshot();
  });

  describe('Functional components with default params', () => {
    it('should find default props that are literals', () => {
      const src = `
        ({
          foo = "bar",
          bar = 42,
          baz = ["foo", "bar"],
          abc = {xyz: abc.def, 123: 42}
        }) => <div />
      `;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 0, 'expression'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('should override with defaultProps if available', () => {
      const src = `
        var Foo = ({
          foo = "bar",
          bar = 42,
          baz = ["foo", "bar"],
          abc = 'test'
        }) => <div />
        Foo.defaultProps = { abc: {xyz: abc.def, 123: 42} };
      `;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 0, 'declarations', 0, 'init'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('should work with aliases', () => {
      const src = `
        ({
          foo = "bar",
          bar = 42,
          baz = ["foo", "bar"],
          abc: defg = {xyz: abc.def, 123: 42}
        }) => <div />
      `;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 0, 'expression'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('should find prop default values that are imported variables', () => {
      const src = `
        import ImportedComponent from './ImportedComponent';

        ({
          foo = ImportedComponent,
        }) => <div />
      `;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 1, 'expression'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('should work with no defaults', () => {
      const src = `
        ({ foo }) => <div />
      `;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 0, 'expression'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });

  describe('forwardRef', () => {
    it('resolves default props in the parameters', () => {
      const src = `
        import React from 'react';
        React.forwardRef(({ foo = 'bar' }, ref) => <div ref={ref}>{foo}</div>);
      `;
      defaultPropsHandler(
        documentation,
        parse(src).get('body', 1, 'expression'),
      );
      expect(documentation.descriptors).toMatchSnapshot();
    });

    it('resolves defaultProps', () => {
      const src = `
        import React from 'react';
        const Component = React.forwardRef(({ foo }, ref) => <div ref={ref}>{foo}</div>);
        Component.defaultProps = { foo: 'baz' };
      `;
      defaultPropsHandler(documentation, parse(src).get('body', 1));
      expect(documentation.descriptors).toMatchSnapshot();
    });
  });
});
