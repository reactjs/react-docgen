import { Component } from 'react';
import Panel, { EditorMode } from './Panel';
import OptionPanel, { Language } from './OptionPanel';
import type { Config } from 'react-docgen';
import { parse, builtinResolvers } from 'react-docgen';

const defaultPlugins = [
  'jsx',
  'asyncDoExpressions',
  'decimal',
  'decorators',
  'decoratorAutoAccessors',
  'destructuringPrivate',
  'doExpressions',
  'explicitResourceManagement',
  'exportDefaultFrom',
  'functionBind',
  'functionSent',
  'importAssertions',
  'importReflection',
  'moduleBlocks',
  'partialApplication',
  ['pipelineOperator', { proposal: 'minimal' }],
  'recordAndTuple',
  'regexpUnicodeSets',
  'throwExpressions',
];

interface PlaygroundProps {
  initialContent: string;
  initialLanguage: Language;
}

export type EditorMode = 'application/json' | 'text/jsx' | 'text/plain';

interface PlaygroundState {
  value: string;
  content: string;
  language: Language;
  options: Config;
}

const {
  ChainResolver,
  FindAllDefinitionsResolver,
  FindAnnotatedDefinitionsResolver,
} = builtinResolvers;

const resolver = new ChainResolver(
  [new FindAnnotatedDefinitionsResolver(), new FindAllDefinitionsResolver()],
  { chainingLogic: ChainResolver.Logic.ALL },
);

export default class App extends Component<PlaygroundProps, PlaygroundState> {
  constructor(props: PlaygroundProps) {
    super(props);

    const options = this.buildOptions(props.initialLanguage);

    this.state = {
      value: this.compile(props.initialContent, options),
      content: props.initialContent,
      language: props.initialLanguage,
      options,
    };
  }

  compile(value: string, options: Config) {
    return JSON.stringify(parse(value, options), null, 2);
  }

  handleChange = (value: string) => {
    let result;

    try {
      result = this.compile(value, this.state.options);
    } catch (err) {
      result = String(err);
    }
    this.setState({ value: result, content: value });
  };

  buildOptions(language: Language): Config {
    const options: Config = {
      resolver,
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
          <div className="w-48 flex-none self-auto p-5">
            <OptionPanel
              language={this.state.language}
              onLanguageChange={this.handleLanguageChange}
            />
          </div>
          <div className="h-full w-1/2 flex-auto self-auto overflow-hidden">
            <Panel value={this.state.content} onChange={this.handleChange} />
          </div>
          <div className="h-full w-1/2 flex-auto self-auto overflow-hidden">
            <Panel
              readOnly={true}
              language={EditorMode.JSON}
              value={this.state.value}
            />
          </div>
        </div>
      </>
    );
  }
}
