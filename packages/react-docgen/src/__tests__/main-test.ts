import { builtinHandlers, parse, ERROR_CODES } from '../main.js';
import { describe, expect, test } from 'vitest';

// TODO make fixtures out of them?
describe('main', () => {
  function testMain(source: string) {
    test('parses with default resolver/handlers', () => {
      const docs = parse(source);

      expect(docs).toMatchSnapshot();
    });

    test('parses with custom handlers', () => {
      const docs = parse(source, {
        handlers: [builtinHandlers.componentDocblockHandler],
      });

      expect(docs).toMatchSnapshot();
    });
  }

  describe('React.createClass', () => {
    testMain(`
      var React = require("react");
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
    testMain(`
      const React = require("react");
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
    testMain(`
      import React, {PropTypes} from "react";

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
    testMain(`
      import React, {PropTypes} from "react";

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
    testMain(`
      import React, {PropTypes} from "react";

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
    test('is not so greedy', () => {
      const source = `
        import React, {PropTypes} from "react";

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

      expect(() => parse(source)).toThrowError(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_DEFINITION,
        }),
      );
    });
  });
});
