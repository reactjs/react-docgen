/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('../../Documentation');

import {
  expression,
  statement,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';

describe('setPropDescription', () => {
  let defaultDocumentation;
  let setPropDescription;

  beforeEach(() => {
    defaultDocumentation = new (require('../../Documentation'))();
    setPropDescription = require('../setPropDescription').default;
  });

  const mockImporter = makeMockImporter({
    foo: statement(`
      export default 'foo';
    `).get('declaration'),
  });

  function getDescriptors(src, documentation = defaultDocumentation) {
    const node = expression(src).get('properties', 0);

    setPropDescription(documentation, node, noopImporter);

    return documentation.descriptors;
  }

  it('detects comments', () => {
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

  it('does not update description if already set', () => {
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

  it('sets an empty description if comment does not exist', () => {
    const descriptors = getDescriptors(`{
      hal: boolean,
    }`);

    expect(descriptors).toEqual({
      hal: {
        description: '',
      },
    });
  });

  it('resolves computed props to imported values', () => {
    const src = `
      ({
        /**
        * my description 3
        */

        [a]: boolean,
      });
      import a from 'foo';
    `;
    const node = statement(src).get('expression', 'properties', 0);

    setPropDescription(defaultDocumentation, node, mockImporter);

    expect(defaultDocumentation.descriptors).toEqual({
      foo: {
        description: 'my description 3',
      },
    });
  });
});
