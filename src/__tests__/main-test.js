/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.autoMockOff();

describe('main', () => {
  var docgen;

  beforeEach(() => {
    docgen = require('../main');
  });

  function test(source) {
    it('parses with default resolver/handlers', () => {
      var docs = docgen.parse(source);
      expect(docs).toEqual({
        description: 'Example component description',
        props: {
          foo: {
            type: {
              name: 'bool',
            },
            defaultValue: {
              computed: false,
              value: 'true',
            },
            description: 'Example prop description',
            required: false,
          },
        },
      });
    });

    it('parses with custom handlers', () => {
      var docs = docgen.parse(source, null, [
        docgen.handlers.componentDocblockHandler,
      ]);
      expect(docs).toEqual({
        description: 'Example component description',
        props: {},
      });
    });
  }

  describe('React.createClass', () => {
    test(`
      var React = require("React");
      var PropTypes = React.PropTypes;
      /**
       * Example component description
       */
      var Component = React.createClass({
        propTypes: {
          /**
           * Example prop description
           */
          foo: PropTypes.bool
        },
        getDefaultProps: function() {
          return {
            foo: true
          };
        }
      });
      module.exports = Component
    `);
  });

  describe('Class definition', () => {
    test(`
      var React = require("React");
      var PropTypes = React.PropTypes;
      /**
       * Example component description
       */
      export default class Component extends React.Component {
        static propTypes = {
          /**
           * Example prop description
           */
          foo: PropTypes.bool
        };
        // ...
      }
      Component.defaultProps = {
        foo: true,
      };
    `);
  });

});
