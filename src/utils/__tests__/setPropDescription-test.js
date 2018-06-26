/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, it, expect, beforeEach*/

jest.disableAutomock();
jest.mock('../../Documentation');

describe('setPropDescription', () => {
  let expression;
  let defaultDocumentation;
  let setPropDescription;

  beforeEach(() => {
    ({ expression } = require('../../../tests/utils'));

    defaultDocumentation = new (require('../../Documentation'))();
    setPropDescription = require('../setPropDescription').default;
  });

  function getDescriptors(src, documentation = defaultDocumentation) {
    const node = expression(src).get('properties', 0);

    setPropDescription(documentation, node);

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
});
