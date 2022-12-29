import type { Resolver } from 'react-docgen';
import { builtinResolvers } from 'react-docgen';
import loadReactDocgenPlugin from './loadReactDocgenPlugin.js';

const { ChainResolver } = builtinResolvers;

export enum ResolverConfigs {
  FindAll = 'find-all-components',
  FindAllExported = 'find-all-exported-components',
  FindExported = 'find-exported-component',
}

async function loadResolver(input: string): Promise<Resolver> {
  if (input === ResolverConfigs.FindAll) {
    return new builtinResolvers.FindAllDefinitionsResolver();
  } else if (input === ResolverConfigs.FindAllExported) {
    return new builtinResolvers.FindExportedDefinitionsResolver();
  } else if (input === ResolverConfigs.FindExported) {
    return new builtinResolvers.FindExportedDefinitionsResolver({
      limit: 1,
    });
  }

  const loadedResolver = await loadReactDocgenPlugin<Resolver>(
    input,
    'resolver',
  );

  // Check if it is a class constructor
  // If it is we do not know how to construct the resolver so error instead
  if (
    typeof loadedResolver === 'function' &&
    loadedResolver.toString().startsWith('class ')
  ) {
    throw new Error(
      `The provided resolver '${input}' is not a function or a class instance but instead a class.` +
        ' To solve this please make sure to provide a path to a file that returns a class instance.',
    );
  }

  return loadedResolver;
}

export default async function loadResolvers(
  input: string[] | undefined,
): Promise<Resolver | undefined> {
  if (!input || input.length === 0) {
    return;
  }

  if (input.length > 1) {
    return new ChainResolver(await Promise.all(input.map(loadResolver)), {
      chainingLogic: ChainResolver.Logic.ALL,
    });
  }

  return loadResolver(input[0]);
}
