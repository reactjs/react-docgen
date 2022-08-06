import React from 'react';
import Panel from './CodeMirrorPanel';
import Header from './Header';
import { parse } from 'react-docgen';

const codeSample = `import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * General component description.
 */
class MyComponent extends Component {
  render() {
    // ...
  }
}

MyComponent.propTypes = {
  /**
   * Description of prop "foo".
   */
  foo: PropTypes.number,
  /**
   * Description of prop "bar" (a custom validation function).
   */
  bar: function(props, propName, componentName) {
    // ...
  },
  baz: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]).isRequired,
};

MyComponent.defaultProps = {
  foo: 42,
  bar: 21
};

export default MyComponent;
`;

const defaultPlugins = [
  'jsx',
  'asyncGenerators',
  'bigInt',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  ['decorators', { decoratorsBeforeExport: false }],
  'doExpressions',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'functionBind',
  'functionSent',
  'importMeta',
  'logicalAssignment',
  'nullishCoalescingOperator',
  'numericSeparator',
  'objectRestSpread',
  'optionalCatchBinding',
  'optionalChaining',
  ['pipelineOperator', { proposal: 'minimal' }],
  'throwExpressions',
  'topLevelAwait',
];

export default class App extends React.Component {
  constructor() {
    super();
    this._jsonRef = React.createRef();

    const options = this.buildOptions('js');

    this.state = {
      value: this.compile(codeSample, options),
      mode: 'application/json',
      content: codeSample,
      options,
    };
  }

  compile(value, options) {
    return JSON.stringify(parse(value, options), null, 2);
  }

  handleChange = value => {
    let result;
    let mode = 'text/plain';

    try {
      result = this.compile(value, this.state.options);
      mode = 'application/json';
    } catch (err) {
      result = String(err);
    }
    this.setState({ value: result, mode, content: value });
  };

  buildOptions(language) {
    const options = {
      babelOptions: {
        babelrc: false,
        babelrcRoots: false,
        configFile: false,
        filename: 'playground.js',
        parserOpts: {
          plugins: [...defaultPlugins],
        },
      },
    };

    switch (language) {
      case 'ts':
        options.babelOptions.parserOpts.plugins.push('typescript');
        options.babelOptions.filename = 'playground.tsx';
        break;
      case 'flow':
        options.babelOptions.parserOpts.plugins.push('flow');
        break;
    }

    return options;
  }

  handleLanguageChange = language => {
    this.setState({ options: this.buildOptions(language) }, () =>
      this.handleChange(this.state.content),
    );
  };

  render() {
    return (
      <>
        <Header onLanguageChange={this.handleLanguageChange} />
        <div className="panels">
          <Panel
            value={this.state.content}
            mode="text/jsx"
            codeSample={codeSample}
            onChange={this.handleChange}
          />
          <Panel
            readOnly={true}
            ref={this._jsonRef}
            value={this.state.value}
            mode={this.state.mode}
          />
        </div>
      </>
    );
  }
}
