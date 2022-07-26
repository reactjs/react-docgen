import parseJsDoc from '../utils/parseJsDoc';
import type {
  default as Documentation,
  MethodDescriptor,
} from '../Documentation';
import type { Handler } from '.';

// Merges two objects ignoring null/undefined.
function merge<T, U>(obj1: T, obj2: U): (T & U) | null {
  if (obj1 == null && obj2 == null) {
    return null;
  }
  const merged: Record<string, unknown> = {
    ...(obj1 as Record<string, unknown>),
  };
  for (const prop in obj2 as Record<string, unknown>) {
    if (obj2[prop] != null) {
      merged[prop] = obj2[prop];
    }
  }
  return merged as T & U;
}
/**
 * Extract info from the methods jsdoc blocks. Must be run after
 * flowComponentMethodsHandler.
 */
const componentMethodsJsDocHandler: Handler = function (
  documentation: Documentation,
): void {
  let methods = documentation.get('methods') as MethodDescriptor[] | null;
  if (!methods) {
    return;
  }

  // @ts-ignore
  methods = methods.map(method => {
    if (!method.docblock) {
      return method;
    }

    const jsDoc = parseJsDoc(method.docblock);

    const returns = merge(jsDoc.returns, method.returns);
    const params = method.params.map(param => {
      const jsDocParam = jsDoc.params.find(p => p.name === param.name);
      return merge(jsDocParam, param);
    });

    return {
      ...method,
      description: jsDoc.description || null,
      returns,
      params,
    };
  });

  documentation.set('methods', methods);
};

export default componentMethodsJsDocHandler;
