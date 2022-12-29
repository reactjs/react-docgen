import type FileState from '../FileState.js';
import type { ComponentNodePath, Resolver, ResolverClass } from './index.js';
import runResolver from './utils/runResolver.js';

enum ChainingLogic {
  ALL,
  FIRST_FOUND,
}

interface ChainResolverOptions {
  chainingLogic?: ChainingLogic;
}

export default class ChainResolver implements ResolverClass {
  resolvers: Resolver[];
  options: ChainResolverOptions;

  static Logic = ChainingLogic;

  constructor(resolvers: Resolver[], options: ChainResolverOptions) {
    this.resolvers = resolvers;
    this.options = options;
  }

  private resolveFirstOnly(file: FileState): ComponentNodePath[] {
    for (const resolver of this.resolvers) {
      const components = runResolver(resolver, file);

      if (components.length > 0) {
        return components;
      }
    }

    return [];
  }

  private resolveAll(file: FileState): ComponentNodePath[] {
    const allComponents = new Set<ComponentNodePath>();

    for (const resolver of this.resolvers) {
      const components = runResolver(resolver, file);

      components.forEach(component => {
        allComponents.add(component);
      });
    }

    return Array.from(allComponents);
  }

  resolve(file: FileState): ComponentNodePath[] {
    if (this.options.chainingLogic === ChainingLogic.FIRST_FOUND) {
      return this.resolveFirstOnly(file);
    }

    return this.resolveAll(file);
  }
}
