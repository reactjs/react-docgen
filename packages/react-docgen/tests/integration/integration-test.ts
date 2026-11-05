import { describe, expect, test } from 'vitest';
import { loadIntegrationCases } from '@react-docgen-internal/integration-tests';
import { parse, makeFsImporter } from '../../src/main';

describe('integration', () => {
  test('extracts props from the builtin Readonly wrapper', () => {
    const result = parse(
      `interface Props {
        /** The displayed label. */
        label: string;
        disabled?: boolean;
      }
      export default function Example(props: Readonly<Props>) {
        return <div>{props.label}</div>;
      }`,
      { babelOptions: { filename: 'readonly.tsx', babelrc: false } },
    );

    expect(result[0]?.props).toMatchObject({
      label: {
        required: true,
        tsType: { name: 'string' },
        description: 'The displayed label.',
      },
      disabled: { required: false, tsType: { name: 'boolean' } },
    });
  });

  for (const integrationCase of loadIntegrationCases()) {
    test(integrationCase.id, () => {
      const run = () =>
        parse(integrationCase.source, {
          importer: makeFsImporter(),
          babelOptions: {
            filename: integrationCase.filename,
            babelrc: false,
          },
        });

      if (integrationCase.error) {
        expect(run).toThrow(
          expect.objectContaining({ code: integrationCase.error.code }),
        );
      } else {
        expect(run()).toEqual(integrationCase.output);
      }
    });
  }
});
