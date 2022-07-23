import type { ParserOptions, TransformOptions } from '@babel/core';
import { loadPartialConfig, parseSync } from '@babel/core';
import type { File } from '@babel/types';
import path from 'path';

const TYPESCRIPT_EXTS = {
  '.ts': true,
  '.tsx': true,
};

function getDefaultPlugins(
  options: TransformOptions,
): NonNullable<ParserOptions['plugins']> {
  return [
    'jsx',
    TYPESCRIPT_EXTS[path.extname(options.filename || '')]
      ? 'typescript'
      : 'flow',
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
}

export type Options = TransformOptions & { parserOptions?: ParserOptions };
export type Parser = (src: string) => File;

function buildPluginList(
  parserOptions: ParserOptions | undefined,
  babelOptions: TransformOptions,
): NonNullable<ParserOptions['plugins']> {
  let plugins: NonNullable<ParserOptions['plugins']> = [];

  if (parserOptions && parserOptions.plugins) {
    plugins = [...parserOptions.plugins];
  }

  const partialConfig = loadPartialConfig(babelOptions);

  if (
    partialConfig &&
    !partialConfig.hasFilesystemConfig() &&
    plugins.length === 0
  ) {
    plugins = getDefaultPlugins(babelOptions);
  }

  // Ensure that the estree plugin is never active
  if (plugins.includes('estree')) {
    throw new Error(
      //TODO not throw, just remove
      'The estree plugin is active for @babel/parser. As of version 6 react-docgen must have this plugin disabled.',
    );
  }

  return plugins;
}

function buildOptions(
  parserOptions: ParserOptions | undefined,
  babelOptions: TransformOptions,
): ParserOptions {
  const plugins = buildPluginList(parserOptions, babelOptions);

  return {
    ...(parserOptions || {}),
    plugins,
  };
}

export default function buildParse(options: Options = {}): Parser {
  const { parserOptions, ...babelOptions } = options;
  const parserOpts = buildOptions(parserOptions, babelOptions);
  const opts: TransformOptions = {
    parserOpts,
    ...babelOptions,
  };

  return (src: string): File => {
    const ast = parseSync(src, opts);

    if (!ast) {
      throw new Error('Unable to parse source code.');
    }

    return ast;
  };
}
