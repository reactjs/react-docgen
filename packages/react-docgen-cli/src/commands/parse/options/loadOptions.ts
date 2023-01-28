import type { Handler, Importer, Resolver } from 'react-docgen';
import { builtinHandlers, builtinImporters } from 'react-docgen';
import loadReactDocgenPlugin from './loadReactDocgenPlugin.js';
import loadResolvers from './loadResolvers.js';

export default async function loadOptions(input: {
  handler: string[] | undefined;
  importer: string | undefined;
  resolver: string[] | undefined;
}): Promise<{
  handlers: Handler[] | undefined;
  importer: Importer | undefined;
  resolver: Resolver | undefined;
}> {
  const importer =
    input.importer && input.importer.length !== 0
      ? await loadReactDocgenPlugin<Importer>(
          input.importer,
          'importer',
          builtinImporters,
        )
      : undefined;

  const handlers = input.handler
    ? await Promise.all(
        input.handler.map(async (handler) => {
          return await loadReactDocgenPlugin<Handler>(
            handler,
            'handler',
            builtinHandlers,
          );
        }),
      )
    : undefined;

  return {
    handlers,
    importer,
    resolver: await loadResolvers(input.resolver),
  };
}
