import React from 'react';
import ReactDOM from 'react-dom';
import Panel from './CodeMirrorPanel';
import { parse } from 'react-docgen';

import 'codemirror/lib/codemirror.css';
import './react-docgen.less';

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
  foo: PropTypes.number.isRequired,
  /**
   * Description of prop "bar" (a custom validation function).
   */
  bar: function(props, propName, componentName) {
    // ...
  },
  baz: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]),
};

MyComponent.defaultProps = {
  foo: 42,
  bar: 21
};

export default MyComponent;
`;

class App extends React.Component {
  constructor() {
    super();
    this._jsonRef = React.createRef();
    this.state = {
      value: this.compile(codeSample),
      mode: 'application/json',
      content: codeSample,
    };
  }

  compile(value) {
    return JSON.stringify(parse(value), null, 2);
  }

  handleChange = value => {
    let result;
    let mode = 'text/plain';

    try {
      result = this.compile(value);
      mode = 'application/json';
    } catch (err) {
      result = String(err);
    }
    this.setState({ value: result, mode, content: value });
  };

  render() {
    return (
      <>
        <Panel
          value={this.state.content}
          mode="text/jsx"
          codeSample={codeSample}
          onChange={this.compile}
        />
        <Panel
          readOnly={true}
          ref={this._jsonRef}
          value={this.state.value}
          mode={this.state.mode}
        />
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
