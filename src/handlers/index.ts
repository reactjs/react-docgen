import type { NodePath } from '@babel/traverse';
import type Documentation from '../Documentation';
import type { ComponentNode } from '../resolver';

export { default as componentDocblockHandler } from './componentDocblockHandler';
export { default as componentMethodsHandler } from './componentMethodsHandler';
export { default as componentMethodsJsDocHandler } from './componentMethodsJsDocHandler';
export { default as defaultPropsHandler } from './defaultPropsHandler';
export { default as displayNameHandler } from './displayNameHandler';
export { default as flowTypeHandler } from './flowTypeHandler';
export { default as propDocBlockHandler } from './propDocBlockHandler';
export { default as propTypeCompositionHandler } from './propTypeCompositionHandler';
export {
  propTypeHandler,
  contextTypeHandler,
  childContextTypeHandler,
} from './propTypeHandler';

export type Handler = (
  documentation: Documentation,
  componentDefinition: NodePath<ComponentNode>,
) => void;
