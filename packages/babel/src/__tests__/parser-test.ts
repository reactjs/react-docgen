import { expect, test } from 'vitest';
import parser, { parse } from '../index.js';

test('normalizes Babel-specific node names', () => {
  const ast = parser.parse({
    code: 'class Button { static propTypes = { label: "text" }; }',
    filename: 'button.jsx',
  });

  expect(ast).toMatchObject({
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        body: {
          body: [
            {
              type: 'PropertyDefinition',
              value: {
                type: 'ObjectExpression',
                properties: [{ type: 'Property', value: { type: 'Literal' } }],
              },
            },
          ],
        },
      },
    ],
  });
});

test('extracts React documentation with shared handlers', () => {
  expect(
    parse(`
      import PropTypes from 'prop-types';

      /** Button description. */
      export function Button() {}
      Button.propTypes = { label: PropTypes.string.isRequired };
      Button.defaultProps = { label: 'Save' };
    `),
  ).toEqual([
    {
      description: 'Button description.',
      displayName: 'Button',
      methods: [],
      props: {
        label: {
          defaultValue: { computed: false, value: "'Save'" },
          description: '',
          required: false,
          type: { name: 'string' },
        },
      },
    },
  ]);
});
