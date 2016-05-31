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

describe('flowTypeDocBlockHandler', () => {
  var statement, expression;
  var getFlowTypeMock;
  var documentation;
  var flowTypeDocBlockHandler;

  beforeEach(() => {
    ({statement, expression} = require('../../../tests/utils'));
    getFlowTypeMock = jest.genMockFunction().mockImplementation(() => ({}));
    jest.setMock('../../utils/getFlowType', getFlowTypeMock);
    jest.mock('../../utils/getFlowType');

    documentation = new (require('../../Documentation'));
    flowTypeDocBlockHandler = require('../flowTypeDocBlockHandler').default;
  });

  function template(src, typeObject) {
    return `
      ${src}
      var React = require('React');
      var Component = React.Component;

      type Props = ${typeObject};
    `;
  }

  function test(getSrc) {
    it('detects description correctly', () => {
      var flowTypesSrc = `
      {
        /** my description */
        foo: string,
        /** my description 2 */
        bar: number,

        /**
         * my description 3
         */

        hal: boolean,
      }
      `;
      var definition = getSrc(flowTypesSrc);

      flowTypeDocBlockHandler(documentation, definition);

      expect(documentation.descriptors).toEqual({
        foo: {
          description: 'my description',
        },
        bar: {
          description: 'my description 2',
        },
        hal: {
          description: 'my description 3',
        },
      });
    });


    it('does not update description if already set', () => {
      var flowTypesSrc = `
      {
        /** my description */
        foo: string,
      }
      `;
      var definition = getSrc(flowTypesSrc);
      documentation.getPropDescriptor('foo').description = '12345678';

      flowTypeDocBlockHandler(documentation, definition);

      expect(documentation.descriptors).toEqual({
        foo: {
          description: '12345678',
        },
      });
    });
  }

  describe('TypeAlias', () => {
    describe('class definition', () => {
      test(
        propTypesSrc => statement(template(`class Foo extends Component<void, Props, void> {}`, propTypesSrc))
      );
    });

    describe('class definition with inline props', () => {
      test(
          propTypesSrc => statement(template(`class Foo extends Component { props: Props; }`, propTypesSrc))
      );
    });

    describe('stateless component', () => {
      test(
        propTypesSrc => statement(template(`(props: Props) => <div />;`, propTypesSrc)).get('expression')
      );
    });
  });

  it('does not error if flowTypes cannot be found', () => {
    var definition = expression('{fooBar: 42}');
    expect(() => flowTypeDocBlockHandler(documentation, definition))
      .not.toThrow();

    definition = statement('class Foo extends Component {}');
    expect(() => flowTypeDocBlockHandler(documentation, definition))
      .not.toThrow();

    definition = statement('() => <div />');
    expect(() => flowTypeDocBlockHandler(documentation, definition))
      .not.toThrow();
  });

  describe('does not error for unreachable type', () => {
    function test(code) {
      var definition = statement(code).get('expression');

      expect(() => flowTypeDocBlockHandler(documentation, definition))
        .not.toThrow();

      expect(documentation.descriptors).toEqual({});
    }

    it('required', () => {
      test(`
        (props: Props) => <div />;
        var React = require('React');
        var Component = React.Component;

        var Props = require('something');
      `);
    });

    it('imported', () => {
      test(`
        (props: Props) => <div />;
        var React = require('React');
        var Component = React.Component;

        import Props from 'something';
      `);
    });

    it('type imported', () => {
      test(`
        (props: Props) => <div />;
        var React = require('React');
        var Component = React.Component;

        import type Props from 'something';
      `);
    });

    it('not in scope', () => {
      test(`
        (props: Props) => <div />;
        var React = require('React');
        var Component = React.Component;
      `);
    });
  });
});
