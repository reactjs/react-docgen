import type { ParserOptions, TransformOptions } from '@babel/core';
import * as babel from '@babel/core';
import type { File } from '@babel/types';
import { extname } from 'path';

const TYPESCRIPT_EXTS = new Set(['.cts', '.mts', '.ts', '.tsx']);
const { parseSync, version } = babel;
// Babel 7 exports this at runtime, but its DefinitelyTyped definitions omit it.
const loadPartialConfigSync = (
  babel as typeof babel & {
    loadPartialConfigSync: typeof babel.loadPartialConfig;
  }
).loadPartialConfigSync;
const IS_BABEL_8 = Number.parseInt(version, 10) >= 8;

function getDefaultPlugins(
  options: TransformOptions,
): NonNullable<ParserOptions['plugins']> {
  const extension = options.filename ? extname(options.filename) : '';
  const isTypeScript = TYPESCRIPT_EXTS.has(extension);
  const plugins: NonNullable<ParserOptions['plugins']> = [
    ...(isTypeScript && extension !== '.tsx' ? [] : ['jsx' as const]),
    isTypeScript ? 'typescript' : 'flow',
    'asyncDoExpressions',
  ];

  if (!IS_BABEL_8) {
    plugins.push('decimal');
  }

  plugins.push(
    ['decorators', { decoratorsBeforeExport: false }],
    'decoratorAutoAccessors',
    'destructuringPrivate',
    'doExpressions',
    'exportDefaultFrom',
    'functionBind',
  );

  if (!IS_BABEL_8) {
    plugins.push('importAssertions');
  }

  plugins.push('moduleBlocks', 'partialApplication', [
    'pipelineOperator',
    { proposal: IS_BABEL_8 ? 'fsharp' : 'minimal' },
  ]);

  if (!IS_BABEL_8) {
    plugins.push(['recordAndTuple', { syntaxType: 'bar' }]);
  }

  plugins.push('regexpUnicodeSets', 'throwExpressions');

  return plugins;
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

  return ast as File;
}
