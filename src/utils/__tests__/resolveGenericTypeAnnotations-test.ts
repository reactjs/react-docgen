import { statement, noopImporter } from '../../../tests/utils';
import resolveGenericTypeAnnotation from '../resolveGenericTypeAnnotation';

describe('resolveGenericTypeAnnotation', () => {
  it('resolves type', () => {
    const code = `
        var x: Props;
        type Props = { x: string };
    `;
    expect(
      resolveGenericTypeAnnotation(
        statement(code).get(
          'declarations',
          0,
          'id',
          'typeAnnotation',
          'typeAnnotation',
        ),
        noopImporter,
      ),
    ).toMatchSnapshot();
  });
});
