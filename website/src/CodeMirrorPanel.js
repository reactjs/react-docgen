import React from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jsx/jsx';

import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/fold/foldgutter.css';

export default class CodeMirrorPanel extends React.Component {
  static defaultProps = {
    lineNumbers: true,
    tabSize: 2,
    showCursorWhenSelecting: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    //keyMap: 'sublime',
  };
  constructor() {
    super();
    this._textareaRef = React.createRef();
    this._codeMirror = null;
    this._cached = '';
    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
  }

  componentDidMount() {
    const options = Object.assign(
      {
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      },
      this.props,
    );
    delete options.value;
    delete options.onChange;
    delete options.codeSample;

    this._codeMirror = CodeMirror.fromTextArea(
      this._textareaRef.current,
      options,
    );
    this._codeMirror.on('change', this.handleChange);
    this._codeMirror.on('focus', this.handleFocus);

    this.updateValue(this.props.value || '');
  }

  componentWillUnmount() {
    this._codeMirror && this._codeMirror.toTextArea();
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== this._cached && this.props.value != null) {
      this.updateValue(this.props.value);
    }
    if (this.props.mode !== prevProps.mode && this.props.mode != null) {
      this._codeMirror.setOption('mode', this.props.mode);
    }
  }

  updateValue(value) {
    this._cached = value;
    this._codeMirror.setValue(value);
  }

  handleFocus(/* codeMirror, event */) {
    if (this._codeMirror.getValue() === this.props.codeSample) {
      this._codeMirror.execCommand('selectAll');
    }
  }

  handleChange(doc, change) {
    if (change.origin !== 'setValue') {
      this._cached = doc.getValue();
      this.props.onChange(this._cached);
    }
  }

  render() {
    return (
      <div className="editor">
        <textarea ref={this._textareaRef} />
      </div>
    );
  }
}
