import type { RefObject } from 'react';
import { Component, createRef } from 'react';
import Panel from './Panel';
import OptionPanel, { Language } from './OptionPanel';
import type { Config } from 'react-docgen';
import { parse } from 'react-docgen';

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

interface PlaygroundProps {
  initialContent: string;
}

export type EditorMode = 'application/json' | 'text/jsx' | 'text/plain';

interface PlaygroundState {
  value: string;
  mode: EditorMode;
  content: string;
  language: Language;
  options: Config;
}

export default class App extends Component<PlaygroundProps, PlaygroundState> {
  private _jsonRef: RefObject<unknown>;

  constructor(props: PlaygroundProps) {
    super(props);
    this._jsonRef = createRef();

    const initialLanguage = Language.TYPESCRIPT;

    const options = this.buildOptions(initialLanguage);

    this.state = {
      value: this.compile(props.initialContent, options),
      mode: 'application/json',
      content: props.initialContent,
      language: initialLanguage,
      options,
    };
  }

  compile(value: string, options: Config) {
    return JSON.stringify(parse(value, options), null, 2);
  }

  handleChange = (value: string) => {
    let result;
    let mode: EditorMode = 'text/plain';

    try {
      result = this.compile(value, this.state.options);
      mode = 'application/json';
    } catch (err) {
      result = String(err);
    }
    this.setState({ value: result, mode, content: value });
  };

  buildOptions(language: Language): Config {
    const options: Config = {
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
      case Language.TYPESCRIPT:
        options.babelOptions.parserOpts.plugins.push('typescript');
        options.babelOptions.filename = 'playground.tsx';
        break;
      case Language.FLOW:
        options.babelOptions.parserOpts.plugins.push('flow');
        break;
    }

    return options;
  }

  handleLanguageChange = (language: Language) => {
    this.setState({ language, options: this.buildOptions(language) }, () =>
      this.handleChange(this.state.content),
    );
  };

  render() {
    return (
      <>
        <div className="content flex h-[calc(100vh-var(--nextra-navbar-height))] flex-row flex-nowrap items-start justify-start overflow-hidden">
          <div className="w-51 flex-none self-auto p-5">
            <OptionPanel
              language={this.state.language}
              onLanguageChange={this.handleLanguageChange}
            />
          </div>
          <div className="h-full w-1/2 flex-auto self-auto overflow-hidden">
            <Panel
              value={this.state.content}
              codeSample={this.props.initialContent}
              onChange={this.handleChange}
            />
          </div>
          <div className="h-full w-1/2 flex-auto self-auto overflow-hidden">
            <Panel
              readOnly={true}
              ref={this._jsonRef}
              value={this.state.value}
              mode={this.state.mode}
            />
          </div>
        </div>
      </>
    );
  }
}
