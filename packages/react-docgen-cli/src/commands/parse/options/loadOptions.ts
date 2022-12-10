import type { Handler, Importer, Resolver } from 'react-docgen';
import {
  builtinHandlers,
  builtinImporters,
  builtinResolvers,
} from 'react-docgen';
import loadReactDocgenPlugin from './loadReactDocgenPlugin.js';

export default async function loadOptions(input: {
  handlers: string[] | undefined;
  importer: string | undefined;
  resolver: string | undefined;
}): Promise<{
  handlers: Handler[] | undefined;
  importer: Importer | undefined;
  resolver: Resolver | undefined;
}> {
  const resolver =
    input.resolver && input.resolver.length !== 0
      ? await loadReactDocgenPlugin<Resolver>(
          input.resolver,
          'resolver',
          builtinResolvers,
        )
      : undefined;

  const importer =
    input.importer && input.importer.length !== 0
      ? await loadReactDocgenPlugin<Importer>(
          input.importer,
          'importer',
          builtinImporters,
        )
      : undefined;

  const handlers = input.handlers
    ? await Promise.all(
        input.handlers.map(async handler => {
          return await loadReactDocgenPlugin<Handler>(
            handler,
            'handler',
            builtinHandlers,
          );
        }),
      )
    : undefined;

  return { handlers, importer, resolver };
}
