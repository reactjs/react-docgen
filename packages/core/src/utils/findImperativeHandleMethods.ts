import {
  isArrowFunctionExpression,
  isCallExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isLiteral,
  isMemberExpression,
  isObjectExpression,
  isProperty,
  type AstNode,
  type AstPath,
  type FileState,
  type Property,
} from '../internal.js';

function child(path: AstPath, key: string): AstPath | null {
  const value = path.get(key);

  return Array.isArray(value) ? null : value;
}

function children(path: AstPath, key: string): AstPath[] {
  const value = path.get(key);

  return Array.isArray(value) ? value : [];
}

function isFunction(node: AstNode): boolean {
  return (
    isArrowFunctionExpression(node) ||
    isFunctionExpression(node) ||
    isFunctionDeclaration(node)
  );
}

function binds(path: AstPath, name: string): boolean {
  if (isIdentifier(path.node)) return path.node.name === name;
  if (path.node.type === 'AssignmentPattern') {
    const left = child(path, 'left');

    return Boolean(left && binds(left, name));
  }
  if (path.node.type === 'RestElement') {
    const argument = child(path, 'argument');

    return Boolean(argument && binds(argument, name));
  }
  if (path.node.type === 'ObjectPattern') {
    return children(path, 'properties').some((property) => {
      const value = child(property, 'value') ?? child(property, 'argument');

      return Boolean(value && binds(value, name));
    });
  }

  return children(path, 'elements').some((element) => binds(element, name));
}

function binding(path: AstPath, name: string): AstPath | null {
  for (let scope = path.parentPath; scope; scope = scope.parentPath) {
    if (isFunction(scope.node)) {
      const id = child(scope, 'id');

      if (id && binds(id, name)) return scope;
      const parameter = children(scope, 'params').find((param) =>
        binds(param, name),
      );

      if (parameter) return parameter;
    }
    if (scope.node.type === 'CatchClause') {
      const parameter = child(scope, 'param');

      if (parameter && binds(parameter, name)) return parameter;
    }
    if (scope.node.type !== 'Program' && scope.node.type !== 'BlockStatement')
      continue;

    for (const statement of children(scope, 'body')) {
      const declaration = child(statement, 'declaration') ?? statement;
      const id = child(declaration, 'id');

      if (id && binds(id, name)) return declaration;
      for (const variable of children(declaration, 'declarations')) {
        const variableId = child(variable, 'id');

        if (variableId && binds(variableId, name)) {
          return isIdentifier(variableId.node)
            ? (child(variable, 'init') ?? variableId)
            : variableId;
        }
      }
      for (const specifier of children(declaration, 'specifiers')) {
        const local = child(specifier, 'local');

        if (local && binds(local, name)) return specifier;
      }
    }
  }

  return null;
}

function resolve(path: AstPath, seen = new Set<AstNode>()): AstPath {
  if (!isIdentifier(path.node) || seen.has(path.node)) return path;
  seen.add(path.node);
  const value = binding(path, path.node.name);

  return value ? resolve(value, seen) : path;
}

function isReactImport(path: AstPath): boolean {
  const source = path.parentPath && child(path.parentPath, 'source');

  return Boolean(
    source &&
    isLiteral(source.node) &&
    ['react', 'react/addons', 'react-native'].includes(
      String(source.node.value),
    ),
  );
}

function isReactHook(path: AstPath, name: string): boolean {
  const value = resolve(path);

  if (isMemberExpression(value.node) && !value.node.computed) {
    if (!isIdentifier(value.node.property, { name })) return false;
    const object = child(value, 'object');

    if (!object) return false;
    const imported = resolve(object);

    return (
      ['ImportDefaultSpecifier', 'ImportNamespaceSpecifier'].includes(
        imported.node.type,
      ) && isReactImport(imported)
    );
  }
  const imported = child(value, 'imported');

  return Boolean(
    value.node.type === 'ImportSpecifier' &&
    imported &&
    isIdentifier(imported.node, { name }) &&
    isReactImport(value),
  );
}

export interface ImperativeHandleMethod {
  property: Property;
  fn: AstNode;
}

interface MethodState {
  file: FileState;
  methods: ImperativeHandleMethod[];
}

interface ReturnState {
  file: FileState;
  object: AstPath;
}

function visit<State extends { file: FileState }>(
  path: AstPath,
  visitor: (path: AstPath, state: State) => boolean,
  state: State,
): void {
  if (
    visitor(path, state) ||
    isFunction(path.node) ||
    path.node.type === 'ClassDeclaration' ||
    path.node.type === 'ClassExpression'
  )
    return;
  for (const key of state.file.visitorKeys[path.node.type] ?? []) {
    const value = path.get(key);

    for (const nested of Array.isArray(value) ? value : value ? [value] : []) {
      visit(nested, visitor, state);
    }
  }
}

function returnVisitor(path: AstPath, state: ReturnState): boolean {
  if (path.node.type !== 'ReturnStatement') return false;
  const argument = child(path, 'argument');

  if (argument) {
    const object = resolve(argument);

    if (isObjectExpression(object.node)) state.object = object;
  }

  return true;
}

function methodVisitor(path: AstPath, state: MethodState): boolean {
  if (!isCallExpression(path.node)) return false;
  const callee = child(path, 'callee');
  const factory = children(path, 'arguments')[1];

  if (
    !callee ||
    !isReactHook(callee, 'useImperativeHandle') ||
    !factory ||
    !isFunction(factory.node)
  )
    return true;
  const factoryBody = child(factory, 'body');

  if (!factoryBody) return true;
  let object = resolve(factoryBody);

  if (!isObjectExpression(object.node)) {
    const returnState: ReturnState = { file: state.file, object };

    visit(factoryBody, returnVisitor, returnState);
    object = returnState.object;
  }
  if (!isObjectExpression(object.node)) return true;

  for (const property of children(object, 'properties')) {
    if (!isProperty(property.node)) continue;
    const value = child(property, 'value');

    if (!value) continue;
    let fn = resolve(value);

    if (isCallExpression(fn.node)) {
      const hook = child(fn, 'callee');
      const callback = children(fn, 'arguments')[0];

      if (!hook || !isReactHook(hook, 'useCallback') || !callback) continue;
      fn = resolve(callback);
    }
    if (isFunction(fn.node)) {
      state.methods.push({ property: property.node, fn: fn.node });
    }
  }

  return true;
}

export default function findImperativeHandleMethods(
  file: FileState,
  component: AstPath,
): ImperativeHandleMethod[] {
  const state: MethodState = { file, methods: [] };
  const body = child(component, 'body');

  if (body) visit(body, methodVisitor, state);

  return state.methods;
}
