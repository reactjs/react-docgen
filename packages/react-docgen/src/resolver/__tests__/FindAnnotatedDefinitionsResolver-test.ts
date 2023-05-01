import type { NodePath } from '@babel/traverse';
import { parse, noopImporter } from '../../../tests/utils';
import FindAnnotatedDefinitionsResolver from '../FindAnnotatedDefinitionsResolver.js';
import { describe, expect, test } from 'vitest';

describe('FindAnnotatedDefinitionsResolver', () => {
  const resolver = new FindAnnotatedDefinitionsResolver();

  function findComponentsInSource(
    source: string,
    importer = noopImporter,
  ): NodePath[] {
    return resolver.resolve(parse(source, {}, importer, true));
  }

  describe('class definitions', () => {
    test('finds ClassDeclaration with line comment', () => {
      const source = `
        // @component
        class Component {}
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds ClassDeclaration with line comment and empty line', () => {
      const source = `
        // @component

        class Component {}
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds ClassDeclaration with block comment', () => {
      const source = `
        /* @component */
        class Component {}
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds ClassDeclaration with block comment and empty line', () => {
      const source = `
        /* @component */

        class Component {}
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds ClassExpression', () => {
      const source = `
        // @component
        const Component = class {}
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds ClassExpression with assignment', () => {
      const source = `
        let Component;
        // @component
        Component = class {}
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds nothing when not annotated', () => {
      const source = `
        class ComponentA {}
        const ComponentB = class {}
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('stateless components', () => {
    test('finds ArrowFunctionExpression', () => {
      const source = `
        // @component
        const Component = () => {};
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds FunctionDeclaration', () => {
      const source = `
        // @component
        function Component() {}
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds FunctionExpression', () => {
      const source = `
        // @component
        const Component = function() {};
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds ObjectMethod', () => {
      const source = `
        const obj = {
          // @component
          component() {}
        };
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds ObjectProperty', () => {
      const source = `
        const obj = {
          // @component
          component: function() {}
        };
      `;

      expect(findComponentsInSource(source)).toMatchSnapshot();
    });

    test('finds nothing when not annotated', () => {
      const source = `
        const ComponentA = () => {};
        function ComponentB() {}
        const ComponentC = function() {};
        const obj = { component() {} };
        const obj2 = { component: function() {} };
      `;

      const result = findComponentsInSource(source);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  test('finds component wrapped in HOC', () => {
    const source = `
        // @component
        const Component = React.memo(() => {});
      `;

    expect(findComponentsInSource(source)).toMatchSnapshot();
  });

  test('finds named exported component', () => {
    const source = `
        // @component
        export const Component = () => {};
      `;

    expect(findComponentsInSource(source)).toMatchSnapshot();
  });

  test('finds default exported component', () => {
    const source = `
        // @component
        export default () => {};
      `;

    expect(findComponentsInSource(source)).toMatchSnapshot();
  });

  test('finds component wrapped in two HOCs', () => {
    const source = `
        // @component
        const Component = React.memo(otherHOC(() => {}));
      `;

    expect(findComponentsInSource(source)).toMatchSnapshot();
  });

  test('finds component wrapped in function', () => {
    const source = `
        function X () {
          // @component
          const subcomponent = class {}
        }
      `;

    expect(findComponentsInSource(source)).toMatchSnapshot();
  });

  test('does not traverse up ArrayExpressions', () => {
    const source = `
        // @component
        const arr = [
          function() {},
          function() {}
        ]
      `;

    const result = findComponentsInSource(source);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('does not traverse up function parameters', () => {
    const source = `
        // @component
        function x(component = () => {}) {}
      `;

    const result = findComponentsInSource(source);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].type).not.toBe('ArrowFunctionExpression');
  });

  test('finds function parameter with annotation', () => {
    const source = `
        function x(component = /* @component */() => {}) {}
      `;

    expect(findComponentsInSource(source)).toMatchSnapshot();
  });
});
