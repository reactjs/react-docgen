import fs from 'fs';
import path from 'path';
import { handlers, parse, importers } from '../main';
import { ERROR_MISSING_DEFINITION } from '../parse';

describe('main', () => {
  function test(source: string) {
    it('parses with default resolver/handlers', () => {
      const docs = parse(source);

      expect(docs).toMatchSnapshot();
    });

    it('parses with custom handlers', () => {
      const docs = parse(source, undefined, [
        handlers.componentDocblockHandler,
      ]);

      expect(docs).toMatchSnapshot();
    });
  }

  describe('React.createClass', () => {
    test(`
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
    test(`
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
    test(`
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
    test(`
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
    test(`
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
    it('is not so greedy', () => {
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

      expect(() => parse(source)).toThrowError(ERROR_MISSING_DEFINITION);
    });
  });

  // Fixures uses the filesystem importer for easier e2e tests
  // even though it is not the default
  describe('fixtures', () => {
    const fixturePath = path.join(__dirname, 'fixtures');
    const fileNames = fs.readdirSync(fixturePath);

    for (let i = 0; i < fileNames.length; i++) {
      const filePath = path.join(fixturePath, fileNames[i]);
      const fileContent = fs.readFileSync(filePath, 'utf8');

      it(`processes component "${fileNames[i]}" without errors`, () => {
        let result;

        expect(() => {
          result = parse(
            fileContent,
            undefined,
            undefined,
            importers.makeFsImporter(),
            {
              filename: filePath,
              babelrc: false,
            },
          );
        }).not.toThrowError();
        expect(result).toMatchSnapshot();
      });
    }
  });
});
