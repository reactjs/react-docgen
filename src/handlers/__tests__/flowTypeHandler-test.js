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

jest.autoMockOff();
jest.mock('../../Documentation');

describe('flowTypeHandler', () => {
  var statement, expression;
  var getFlowTypeMock;
  var documentation;
  var flowTypeHandler;

  beforeEach(() => {
    ({statement, expression} = require('../../../tests/utils'));
    getFlowTypeMock = jest.genMockFunction().mockImplementation(() => ({}));
    jest.setMock('../../utils/getFlowType', getFlowTypeMock);
    jest.mock('../../utils/getFlowType');

    documentation = new (require('../../Documentation'));
    flowTypeHandler = require('../flowTypeHandler');
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
    it('detects types correctly', () => {
      var flowTypesSrc = `
      {
        foo: string,
        bar: number,
        hal: boolean,
      }
      `;
      var definition = getSrc(flowTypesSrc);

      flowTypeHandler(documentation, definition);

      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
        },
        bar: {
          flowType: {},
          required: true,
        },
        hal: {
          flowType: {},
          required: true,
        },
        });
    });

    it('detects whether a prop is required', () => {
      var flowTypesSrc = `
      {
        foo: string,
        bar?: number,
      }
      `;
      var definition = getSrc(flowTypesSrc);

      flowTypeHandler(documentation, definition);

      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
        },
        bar: {
          flowType: {},
          required: false,
        },
      });
    });

    it('detects union types', () => {
      var flowTypesSrc = `
      {
        foo: string | number,
        bar: "test" | 1 | true,
      }
      `;
      var definition = getSrc(flowTypesSrc);

      flowTypeHandler(documentation, definition);

      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
        },
        bar: {
          flowType: {},
          required: true,
        },
      });
    });

    it('detects intersection types', () => {
      var flowTypesSrc = `
      {
        foo: Foo & Bar,
      }
      `;
      var definition = getSrc(flowTypesSrc);

      flowTypeHandler(documentation, definition);

      expect(documentation.descriptors).toEqual({
        foo: {
          flowType: {},
          required: true,
        },
      });
    });
  }

  describe('TypeAlias', () => {
    describe('class definition', () => {
      test(
        propTypesSrc => statement(template('class Foo extends Component<void, Props, void> {}', propTypesSrc))
      );
    });

    describe('class definition with inline props', () => {
      test(
          propTypesSrc => statement(template('class Foo extends Component { props: Props; }', propTypesSrc))
      );
    });

    describe('stateless component', () => {
      test(
        propTypesSrc => statement(template('(props: Props) => <div />;', propTypesSrc)).get('expression')
      );
    });
  });

  it('does not error if flowTypes cannot be found', () => {
    var definition = expression('{fooBar: 42}');
    expect(() => flowTypeHandler(documentation, definition))
      .not.toThrow();

    definition = statement('class Foo extends Component {}');
    expect(() => flowTypeHandler(documentation, definition))
      .not.toThrow();

    definition = statement('() => <div />');
    expect(() => flowTypeHandler(documentation, definition))
      .not.toThrow();
  });

  it('supports intersection proptypes', () => {
    var definition = statement(`
      (props: Props) => <div />;
     
      var React = require('React');
      import type Imported from 'something';
  
      type Props = Imported & { foo: 'bar' };
    `).get('expression');


    flowTypeHandler(documentation, definition);

    expect(documentation.descriptors).toEqual({
      foo: {
        flowType: {},
        required: true,
      },
    });
  });

  it('supports union proptypes', () => {
    var definition = statement(`
      (props: Props) => <div />;
      
      var React = require('React');
      import type Imported from 'something';

      type Props = Imported | { foo: 'bar' };
    `).get('expression');

    flowTypeHandler(documentation, definition);

    expect(documentation.descriptors).toEqual({
      foo: {
        flowType: {},
        required: true,
      },
    });
  });

  describe('does not error for unreachable type', () => {
    function test(code) {
      var definition = statement(code).get('expression');

      expect(() => flowTypeHandler(documentation, definition))
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
