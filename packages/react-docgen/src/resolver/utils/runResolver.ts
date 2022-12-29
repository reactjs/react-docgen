import type FileState from '../../FileState.js';
import type { Resolver, ResolverClass, ResolverFunction } from '../index.js';

function isResolverClass(resolver: Resolver): resolver is ResolverClass {
  return typeof resolver === 'object';
}

export default function runResolver(
  resolver: Resolver,
  file: FileState,
): ReturnType<ResolverFunction> {
  return isResolverClass(resolver) ? resolver.resolve(file) : resolver(file);
}
