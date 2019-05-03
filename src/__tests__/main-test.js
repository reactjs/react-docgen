/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global describe, it, expect*/

import fs from 'fs';
import path from 'path';

import * as docgen from '../main';
import { ERROR_MISSING_DEFINITION } from '../parse';

describe('main', () => {
  function test(source) {
    it('parses with default resolver/handlers', () => {
      const docs = docgen.parse(source);
      expect(docs).toEqual({
        displayName: 'ABC',
        description: 'Example component description',
        methods: [],
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
      const docs = docgen.parse(source, null, [
        docgen.handlers.componentDocblockHandler,
      ]);
      expect(docs).toEqual({
        description: 'Example component description',
      });
    });
  }

  describe('React.createClass', () => {
    test(`
      var React = require("React");
      var PropTypes = React.PropTypes;

      var defaultProps = {
        foo: true,
      };
      var propTypes =  {
        /**
         * Example prop description
         */
        foo: PropTypes.bool
      };

      /**
       * Example component description
       */
      var Component = React.createClass({
        displayName: 'ABC',
        propTypes,
        getDefaultProps: function() {
          return defaultProps;
        }
      });
      module.exports = Component
    `);
  });

  describe('Class definition', () => {
    test(`
      const React = require("React");
      const PropTypes = React.PropTypes;

      const defaultProps = {
        foo: true,
      };
      const propTypes =  {
        /**
         * Example prop description
         */
        foo: PropTypes.bool
      };

      /**
       * Example component description
       */
      export default class Component extends React.Component {
        static propTypes = propTypes;
        // ...
      }
      Component.defaultProps = defaultProps;
      Component.displayName = 'ABC';
    `);
  });

  describe('Stateless Component definition: ArrowFunctionExpression', () => {
    test(`
      import React, {PropTypes} from "React";

      const defaultProps = {
        foo: true,
      };
      const propTypes =  {
        /**
         * Example prop description
         */
        foo: PropTypes.bool
      };

      /**
        * Example component description
        */
      let Component = props => <div />;
      Component.displayName = 'ABC';
      Component.defaultProps = defaultProps;
      Component.propTypes = propTypes;

      export default Component;
    `);
  });

  describe('Stateless Component definition: FunctionDeclaration', () => {
    test(`
      import React, {PropTypes} from "React";

      const defaultProps = {
        foo: true,
      };
      const propTypes =  {
        /**
         * Example prop description
         */
        foo: PropTypes.bool
      };

      /**
      * Example component description
      */
      function Component (props) {
        return <div />;
      }

      Component.displayName = 'ABC';
      Component.defaultProps = defaultProps;
      Component.propTypes = propTypes;

      export default Component;
    `);
  });

  describe('Stateless Component definition: FunctionExpression', () => {
    test(`
      import React, {PropTypes} from "React";

      const defaultProps = {
        foo: true,
      };
      const propTypes =  {
        /**
         * Example prop description
         */
        foo: PropTypes.bool
      };

      /**
      * Example component description
      */
      let Component = function(props) {
        return React.createElement('div', null);
      }

      Component.displayName = 'ABC';
      Component.defaultProps = defaultProps;
      Component.propTypes = propTypes;

      export default Component;
    `);
  });

  describe('Stateless Component definition', () => {
    it('is not so greedy', () => {
      const source = `
        import React, {PropTypes} from "React";

        /**
        * Example component description
        */
        let NotAComponent = function(props) {
          let HiddenComponent = () => React.createElement('div', null);

          return 7;
        }

        NotAComponent.displayName = 'ABC';
        NotAComponent.defaultProps = {
            foo: true
        };

        NotAComponent.propTypes = {
          /**
          * Example prop description
          */
          foo: PropTypes.bool
        };

        export default NotAComponent;
      `;

      expect(() => docgen.parse(source)).toThrowError(ERROR_MISSING_DEFINITION);
    });
  });

  describe('fixtures', () => {
    const fixturePath = path.join(__dirname, 'fixtures');
    const fileNames = fs.readdirSync(fixturePath);
    for (let i = 0; i < fileNames.length; i++) {
      const filePath = path.join(fixturePath, fileNames[i]);
      const fileContent = fs.readFileSync(filePath);

      it(`processes component "${fileNames[i]}" without errors`, () => {
        let result;
        expect(() => {
          result = docgen.parse(fileContent, null, null, {
            filename: filePath,
            babelrc: false,
          });
        }).not.toThrowError();
        expect(result).toMatchSnapshot();
      });
    }
  });
});
