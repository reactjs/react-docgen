/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

const os = require('os');
const EOL = os.EOL;

jest.disableAutomock();
jest.mock('../../Documentation');

describe('propDocBlockHandler', () => {
  let expression, statement;
  let documentation;
  let propDocBlockHandler;

  beforeEach(() => {
    ({ expression, statement } = require('../../../tests/utils'));
    documentation = new (require('../../Documentation'))();
    propDocBlockHandler = require('../propDocBlockHandler').default;
  });

  function test(getSrc, parse) {
    it('finds docblocks for prop types', () => {
      const definition = parse(
        getSrc(
          `{
          /**
           * Foo comment
           */
          foo: Prop.bool,
          /**
           * Bar comment
           */
          bar: Prop.bool,
        }`,
        ),
      );

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
        bar: {
          description: 'Bar comment',
        },
      });
    });

    it('can handle multline comments', () => {
      const definition = parse(
        getSrc(
          `{
          /**
           * Foo comment with
           * many lines!
           *
           * even with empty lines in between
           */
          foo: Prop.bool,
        }`,
        ),
      );

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description:
            'Foo comment with' +
            EOL +
            'many lines!' +
            EOL +
            '\neven with empty lines in between',
        },
      });
    });

    it('ignores non-docblock comments', () => {
      const definition = parse(
        getSrc(
          `{
          /**
           * Foo comment
           */
          // TODO: remove this comment
          foo: Prop.bool,
          /**
           * Bar comment
           */
          /* This is not a doc comment */
          bar: Prop.bool,
        }`,
        ),
      );

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
        bar: {
          description: 'Bar comment',
        },
      });
    });

    it('only considers the comment with the property below it', () => {
      const definition = parse(
        getSrc(
          `{
          /**
           * Foo comment
           */
          foo: Prop.bool,
          bar: Prop.bool,
        }`,
        ),
      );

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
        bar: {
          description: '',
        },
      });
    });

    it('understands and ignores the spread operator', () => {
      const definition = parse(
        getSrc(
          `{
          ...Foo.propTypes,
          /**
           * Foo comment
           */
          foo: Prop.bool,
        }`,
        ),
      );

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
      });
    });

    it('resolves variables', () => {
      const definition = parse(`
        ${getSrc('Props')}
        var Props = {
          /**
           * Foo comment
           */
          foo: Prop.bool,
        };
      `);

      propDocBlockHandler(documentation, definition);
      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'Foo comment',
        },
      });
    });
  }

  describe('React.createClass', () => {
    test(
      propTypesSrc => `({propTypes: ${propTypesSrc}})`,
      src => statement(src).get('expression'),
    );
  });

  describe('ClassDefinition', () => {
    describe('class property', () => {
      test(
        propTypesSrc => `
          class Foo{
            static propTypes = ${propTypesSrc};
          }
        `,
        src => statement(src),
      );
    });

    describe('static getter', () => {
      test(
        propTypesSrc => `
          class Foo{
            static get propTypes() {
              return ${propTypesSrc};
            }
          }
        `,
        src => statement(src),
      );
    });
  });

  it('does not error if propTypes cannot be found', () => {
    let definition = expression('{fooBar: 42}');
    expect(() => propDocBlockHandler(documentation, definition)).not.toThrow();

    definition = statement('class Foo {}');
    expect(() => propDocBlockHandler(documentation, definition)).not.toThrow();
  });
});
