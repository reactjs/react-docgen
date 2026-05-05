'use client';

import { Component } from 'react';
import Panel, { EditorMode } from './Panel';
import OptionPanel, {
  HandlerId,
  HandlerPreset,
  Language,
  ResolverPreset,
  allHandlerIds,
} from './OptionPanel';
import type { Config, Handler, Resolver } from 'react-docgen';
import { parse, builtinHandlers, builtinResolvers } from 'react-docgen';

type Plugins = NonNullable<
  NonNullable<NonNullable<Config['babelOptions']>['parserOpts']>['plugins']
>;

const defaultPlugins: Plugins = [
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

interface PlaygroundState {
  value: string;
  content: string;
  handlerPreset: HandlerPreset;
  language: Language;
  options: Config;
  resolverPreset: ResolverPreset;
  selectedHandlerIds: HandlerId[];
}

const {
  FindAllDefinitionsResolver,
  FindAnnotatedDefinitionsResolver,
  FindExportedDefinitionsResolver,
} = builtinResolvers;

const handlerById: Record<HandlerId, Handler> = {
  [HandlerId.CHILD_CONTEXT_TYPE]: builtinHandlers.childContextTypeHandler,
  [HandlerId.CODE_TYPE]: builtinHandlers.codeTypeHandler,
  [HandlerId.COMPONENT_DOCBLOCK]: builtinHandlers.componentDocblockHandler,
  [HandlerId.COMPONENT_METHODS]: builtinHandlers.componentMethodsHandler,
  [HandlerId.COMPONENT_METHODS_JS_DOC]:
    builtinHandlers.componentMethodsJsDocHandler,
  [HandlerId.CONTEXT_TYPE]: builtinHandlers.contextTypeHandler,
  [HandlerId.DEFAULT_PROPS]: builtinHandlers.defaultPropsHandler,
  [HandlerId.DISPLAY_NAME]: builtinHandlers.displayNameHandler,
  [HandlerId.PROP_DOCBLOCK]: builtinHandlers.propDocblockHandler,
  [HandlerId.PROP_TYPE]: builtinHandlers.propTypeHandler,
  [HandlerId.PROP_TYPE_COMPOSITION]: builtinHandlers.propTypeCompositionHandler,
};

function createResolver(preset: ResolverPreset): Resolver {
  switch (preset) {
    case ResolverPreset.EXPORTED:
      return new FindExportedDefinitionsResolver({ limit: 1 });
    case ResolverPreset.ANNOTATED:
      return new FindAnnotatedDefinitionsResolver();
    case ResolverPreset.ALL_DEFINITIONS:
      return new FindAllDefinitionsResolver();
  }
}

function createHandlers(handlerIds: HandlerId[]): Handler[] {
  return handlerIds.map((handlerId) => handlerById[handlerId]);
}

export default class App extends Component<PlaygroundProps, PlaygroundState> {
  constructor(props: PlaygroundProps) {
    super(props);

    const handlerPreset = HandlerPreset.ALL;
    const resolverPreset = ResolverPreset.ALL_DEFINITIONS;
    const selectedHandlerIds = allHandlerIds;
    const options = this.buildOptions(
      props.initialLanguage,
      resolverPreset,
      selectedHandlerIds,
    );

    this.state = {
      value: this.compile(props.initialContent, options),
      content: props.initialContent,
      handlerPreset,
      language: props.initialLanguage,
      options,
      resolverPreset,
      selectedHandlerIds,
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

  buildOptions(
    language: Language,
    resolverPreset: ResolverPreset,
    selectedHandlerIds: HandlerId[],
  ): Config {
    const options = {
      handlers: createHandlers(selectedHandlerIds),
      resolver: createResolver(resolverPreset),
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

  updateOptions(
    update: Pick<
      PlaygroundState,
      'handlerPreset' | 'language' | 'resolverPreset' | 'selectedHandlerIds'
    >,
  ) {
    const options = this.buildOptions(
      update.language,
      update.resolverPreset,
      update.selectedHandlerIds,
    );

    this.setState({ ...update, options }, () =>
      this.handleChange(this.state.content),
    );
  }

  handleLanguageChange = (language: Language) => {
    this.updateOptions({
      handlerPreset: this.state.handlerPreset,
      language,
      resolverPreset: this.state.resolverPreset,
      selectedHandlerIds: this.state.selectedHandlerIds,
    });
  };

  handleResolverPresetChange = (resolverPreset: ResolverPreset) => {
    this.updateOptions({
      handlerPreset: this.state.handlerPreset,
      language: this.state.language,
      resolverPreset,
      selectedHandlerIds: this.state.selectedHandlerIds,
    });
  };

  handleHandlerPresetChange = (handlerPreset: HandlerPreset) => {
    const selectedHandlerIds =
      handlerPreset === HandlerPreset.ALL
        ? allHandlerIds
        : handlerPreset === HandlerPreset.NONE
          ? []
          : this.state.selectedHandlerIds;

    this.updateOptions({
      handlerPreset,
      language: this.state.language,
      resolverPreset: this.state.resolverPreset,
      selectedHandlerIds,
    });
  };

  handleHandlerToggle = (handlerId: HandlerId) => {
    const selectedHandlerIdsSet = new Set(this.state.selectedHandlerIds);

    if (selectedHandlerIdsSet.has(handlerId)) {
      selectedHandlerIdsSet.delete(handlerId);
    } else {
      selectedHandlerIdsSet.add(handlerId);
    }

    const selectedHandlerIds = allHandlerIds.filter((id) =>
      selectedHandlerIdsSet.has(id),
    );

    this.updateOptions({
      handlerPreset: HandlerPreset.CUSTOM,
      language: this.state.language,
      resolverPreset: this.state.resolverPreset,
      selectedHandlerIds,
    });
  };

  render() {
    return (
      <>
        <div className="content flex h-[calc(100vh-var(--nextra-navbar-height))] flex-row flex-nowrap items-start justify-start overflow-hidden">
          <div className="w-64 flex-none self-auto p-5">
            <OptionPanel
              handlerPreset={this.state.handlerPreset}
              language={this.state.language}
              resolverPreset={this.state.resolverPreset}
              selectedHandlerIds={this.state.selectedHandlerIds}
              onHandlerPresetChange={this.handleHandlerPresetChange}
              onHandlerToggle={this.handleHandlerToggle}
              onLanguageChange={this.handleLanguageChange}
              onResolverPresetChange={this.handleResolverPresetChange}
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
