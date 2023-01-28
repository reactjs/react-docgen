import { parse, makeMockImporter } from '../../../tests/utils';
import setPropDescription from '../setPropDescription.js';
import Documentation from '../../Documentation';
import type { default as DocumentationMock } from '../../__mocks__/Documentation';
import type { ExpressionStatement } from '@babel/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../Documentation.js');

describe('setPropDescription', () => {
  let defaultDocumentation: Documentation & DocumentationMock;

  beforeEach(() => {
    defaultDocumentation = new Documentation() as Documentation &
      DocumentationMock;
  });

  const mockImporter = makeMockImporter({
    foo: (stmtLast) => stmtLast(`export default 'foo';`).get('declaration'),
  });

  function getDescriptors(src: string, documentation = defaultDocumentation) {
    const node = parse.expression(src).get('properties')[0];

    setPropDescription(documentation, node);

    return documentation.descriptors;
  }

  test('detects comments', () => {
    const descriptors = getDescriptors(`{
     /**
       * my description 3
       */

      hal: boolean,
    }`);

    expect(descriptors).toEqual({
      hal: {
        description: 'my description 3',
      },
    });
  });

  test('does not update description if already set', () => {
    defaultDocumentation.getPropDescriptor('foo').description = '12345678';

    const descriptors = getDescriptors(
      `{
      /** my description */
      foo: string,
    }`,
      defaultDocumentation,
    );

    expect(descriptors).toEqual({
      foo: {
        description: '12345678',
      },
    });
  });

  test('sets an empty description if comment does not exist', () => {
    const descriptors = getDescriptors(`{
      hal: boolean,
    }`);

    expect(descriptors).toEqual({
      hal: {
        description: '',
      },
    });
  });

  test('resolves computed props to imported values', () => {
    const src = `
      ({
        /**
        * my description 3
        */

        [a]: boolean,
      });
      import a from 'foo';
    `;
    const node = parse
      .statement<ExpressionStatement>(src, mockImporter)
      .get('expression')
      .get('properties')[0];

    setPropDescription(defaultDocumentation, node);

    expect(defaultDocumentation.descriptors).toEqual({
      foo: {
        description: 'my description 3',
      },
    });
  });
});
