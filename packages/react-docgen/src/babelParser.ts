import type { InputOptions } from '@babel/core';
import { loadPartialConfigSync, parseSync } from '@babel/core';
import type { ParserOptions } from '@babel/parser';
import type { File } from '@babel/types';
import { extname } from 'path';

const TYPESCRIPT_EXTS = new Set(['.cts', '.mts', '.ts', '.tsx']);

function getDefaultPlugins(
  options: InputOptions,
): NonNullable<ParserOptions['plugins']> {
  return [
    'jsx',
    options.filename && TYPESCRIPT_EXTS.has(extname(options.filename))
      ? 'typescript'
      : 'flow',
    'asyncDoExpressions',
    ['decorators', { decoratorsBeforeExport: false }],
    'decoratorAutoAccessors',
    'destructuringPrivate',
    'doExpressions',
    'exportDefaultFrom',
    'functionBind',
    'moduleBlocks',
    'partialApplication',
    ['pipelineOperator', { proposal: 'fsharp' }],
    'regexpUnicodeSets',
    'throwExpressions',
  ];
}

function buildPluginList(
  options: InputOptions,
): NonNullable<ParserOptions['plugins']> {
  let plugins: NonNullable<ParserOptions['plugins']> = [];

  if (options.parserOpts?.plugins) {
    plugins = [...options.parserOpts.plugins];
  }

  // Let's check if babel finds a config file for this source file
  // If babel does find a config file we do not apply our defaults
  const partialConfig = loadPartialConfigSync(options);

  if (
    plugins.length === 0 &&
    partialConfig &&
    !partialConfig.hasFilesystemConfig()
  ) {
    plugins = getDefaultPlugins(options);
  }

  // Ensure that the estree plugin is never active
  // TODO add test
  return plugins.filter((plugin) => plugin !== 'estree');
}

function buildParserOptions(options: InputOptions): ParserOptions {
  const plugins = buildPluginList(options);

  return {
    sourceType: 'unambiguous',
    ...(options.parserOpts || {}),
    plugins,
    tokens: false,
  };
}

export default function babelParser(
  src: string,
  options: InputOptions = {},
): File {
  const parserOpts = buildParserOptions(options);
  const opts: InputOptions = {
    ...options,
    parserOpts,
  };

  const ast = parseSync(src, opts);

  if (!ast) {
    throw new Error('Unable to parse source code.');
  }

  return ast as File;
}
