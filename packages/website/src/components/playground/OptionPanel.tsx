import React from 'react';
import { Select } from 'nextra/components';
import { CheckIcon } from 'nextra/icons';

interface OptionPanelProps {
  handlerPreset: HandlerPreset;
  language: Language;
  resolverPreset: ResolverPreset;
  selectedHandlerIds: HandlerId[];
  onHandlerPresetChange: (preset: HandlerPreset) => void;
  onHandlerToggle: (handlerId: HandlerId) => void;
  onLanguageChange: (language: Language) => void;
  onResolverPresetChange: (preset: ResolverPreset) => void;
}

export enum Language {
  FLOW = 'flow',
  JAVASCRIPT = 'js',
  TYPESCRIPT = 'ts',
}

export enum ResolverPreset {
  ALL_DEFINITIONS = 'all-definitions',
  ANNOTATED = 'annotated',
  EXPORTED = 'exported',
}

export enum HandlerPreset {
  ALL = 'all',
  CUSTOM = 'custom',
  NONE = 'none',
}

export enum HandlerId {
  CHILD_CONTEXT_TYPE = 'childContextTypeHandler',
  CODE_TYPE = 'codeTypeHandler',
  COMPONENT_DOCBLOCK = 'componentDocblockHandler',
  COMPONENT_METHODS = 'componentMethodsHandler',
  COMPONENT_METHODS_JS_DOC = 'componentMethodsJsDocHandler',
  CONTEXT_TYPE = 'contextTypeHandler',
  DEFAULT_PROPS = 'defaultPropsHandler',
  DISPLAY_NAME = 'displayNameHandler',
  PROP_DOCBLOCK = 'propDocblockHandler',
  PROP_TYPE = 'propTypeHandler',
  PROP_TYPE_COMPOSITION = 'propTypeCompositionHandler',
}

export const allHandlerIds = [
  HandlerId.PROP_TYPE,
  HandlerId.CONTEXT_TYPE,
  HandlerId.CHILD_CONTEXT_TYPE,
  HandlerId.PROP_TYPE_COMPOSITION,
  HandlerId.PROP_DOCBLOCK,
  HandlerId.CODE_TYPE,
  HandlerId.DEFAULT_PROPS,
  HandlerId.COMPONENT_DOCBLOCK,
  HandlerId.DISPLAY_NAME,
  HandlerId.COMPONENT_METHODS,
  HandlerId.COMPONENT_METHODS_JS_DOC,
];

const languageOptions = [
  { id: Language.TYPESCRIPT, name: 'TypeScript' },
  { id: Language.JAVASCRIPT, name: 'JavaScript' },
  { id: Language.FLOW, name: 'Flow' },
];

const resolverOptions = [
  { id: ResolverPreset.ALL_DEFINITIONS, name: 'All definitions' },
  { id: ResolverPreset.EXPORTED, name: 'Exported' },
  { id: ResolverPreset.ANNOTATED, name: 'Annotated' },
];

const handlerPresetOptions = [
  { id: HandlerPreset.ALL, name: 'All built-in handlers' },
  { id: HandlerPreset.NONE, name: 'No handlers' },
  { id: HandlerPreset.CUSTOM, name: 'Custom' },
];

const handlerOptions = [
  { id: HandlerId.PROP_TYPE, name: 'propType' },
  { id: HandlerId.CONTEXT_TYPE, name: 'contextType' },
  { id: HandlerId.CHILD_CONTEXT_TYPE, name: 'childContextType' },
  { id: HandlerId.PROP_TYPE_COMPOSITION, name: 'propTypeComposition' },
  { id: HandlerId.PROP_DOCBLOCK, name: 'propDocblock' },
  { id: HandlerId.CODE_TYPE, name: 'codeType' },
  { id: HandlerId.DEFAULT_PROPS, name: 'defaultProps' },
  { id: HandlerId.COMPONENT_DOCBLOCK, name: 'componentDocblock' },
  { id: HandlerId.DISPLAY_NAME, name: 'displayName' },
  { id: HandlerId.COMPONENT_METHODS, name: 'componentMethods' },
  { id: HandlerId.COMPONENT_METHODS_JS_DOC, name: 'componentMethodsJsDoc' },
];

function getSelectedOption<T extends string>(
  options: { id: T; name: string }[],
  selectedId: T,
  optionType: string,
) {
  const selectedOption = options.find((option) => option.id === selectedId);

  if (!selectedOption) {
    throw new Error(`Could not find ${optionType} '${selectedId}'`);
  }

  return selectedOption;
}

function SelectOption({ name }: { name: string }) {
  return (
    <>
      <CheckIcon height="1em" />
      {name}
    </>
  );
}

export default function OptionPanel({
  handlerPreset,
  language,
  resolverPreset,
  selectedHandlerIds,
  onHandlerPresetChange,
  onHandlerToggle,
  onLanguageChange,
  onResolverPresetChange,
}: OptionPanelProps) {
  const selectedLanguage = getSelectedOption(
    languageOptions,
    language,
    'language',
  );
  const selectedResolver = getSelectedOption(
    resolverOptions,
    resolverPreset,
    'resolver preset',
  );
  const selectedHandlerPreset = getSelectedOption(
    handlerPresetOptions,
    handlerPreset,
    'handler preset',
  );

  return (
    <div className="flex flex-col gap-5 text-sm">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Language
        </span>
        <Select
          className="x:flex x:items-center x:gap-2"
          value={selectedLanguage.id}
          title="Change language"
          selectedOption={<SelectOption name={selectedLanguage.name} />}
          options={languageOptions}
          onChange={(lang) => onLanguageChange(lang as Language)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Resolver
        </span>
        <Select
          className="x:flex x:items-center x:gap-2"
          value={selectedResolver.id}
          title="Change resolver"
          selectedOption={<SelectOption name={selectedResolver.name} />}
          options={resolverOptions}
          onChange={(preset) =>
            onResolverPresetChange(preset as ResolverPreset)
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Handlers
        </span>
        <Select
          className="x:flex x:items-center x:gap-2"
          value={selectedHandlerPreset.id}
          title="Change handlers"
          selectedOption={<SelectOption name={selectedHandlerPreset.name} />}
          options={handlerPresetOptions}
          onChange={(preset) => onHandlerPresetChange(preset as HandlerPreset)}
        />

        <div className="mt-1 ml-4 flex flex-col gap-2">
          {handlerOptions.map((handler) => (
            <label
              className="flex min-h-6 cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs leading-5 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
              key={handler.id}
            >
              <input
                checked={selectedHandlerIds.includes(handler.id)}
                className="sr-only"
                type="checkbox"
                onChange={() => onHandlerToggle(handler.id)}
              />
              <span className="flex h-4 w-4 flex-none items-center justify-center">
                <CheckIcon
                  className={
                    selectedHandlerIds.includes(handler.id)
                      ? 'text-gray-600 dark:text-gray-300'
                      : 'text-transparent'
                  }
                  height="1em"
                />
              </span>
              <span>{handler.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
