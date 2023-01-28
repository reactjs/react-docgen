import type { ParserOptions, TransformOptions } from '@babel/core';
import { loadPartialConfig, parseSync } from '@babel/core';
import type { File } from '@babel/types';
import { extname } from 'path';

const TYPESCRIPT_EXTS = {
  '.cts': true,
  '.mts': true,
  '.ts': true,
  '.tsx': true,
};

function getDefaultPlugins(
  options: TransformOptions,
): NonNullable<ParserOptions['plugins']> {
  return [
    'jsx',
    TYPESCRIPT_EXTS[extname(options.filename || '')] ? 'typescript' : 'flow',
    'asyncDoExpressions',
    'decimal',
    ['decorators', { decoratorsBeforeExport: false }],
    'decoratorAutoAccessors',
    'destructuringPrivate',
    'doExpressions',
    'exportDefaultFrom',
    'functionBind',
    'importAssertions',
    'moduleBlocks',
    'partialApplication',
    ['pipelineOperator', { proposal: 'minimal' }],
    ['recordAndTuple', { syntaxType: 'bar' }],
    'regexpUnicodeSets',
    'throwExpressions',
  ];
}

function buildPluginList(
  options: TransformOptions,
): NonNullable<ParserOptions['plugins']> {
  let plugins: NonNullable<ParserOptions['plugins']> = [];

  if (options.parserOpts?.plugins) {
    plugins = [...options.parserOpts.plugins];
  }

  // Let's check if babel finds a config file for this source file
  // If babel does find a config file we do not apply our defaults
  const partialConfig = loadPartialConfig(options);

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

function buildParserOptions(options: TransformOptions): ParserOptions {
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
  options: TransformOptions = {},
): File {
  const parserOpts = buildParserOptions(options);
  const opts: TransformOptions = {
    ...options,
    parserOpts,
  };

  const ast = parseSync(src, opts);

  if (!ast) {
    throw new Error('Unable to parse source code.');
  }

  return ast;
}
