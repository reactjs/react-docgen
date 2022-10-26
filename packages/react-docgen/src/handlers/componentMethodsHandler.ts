import getMemberValuePath from '../utils/getMemberValuePath';
import type { MethodNodePath } from '../utils/getMethodDocumentation';
import getMethodDocumentation from '../utils/getMethodDocumentation';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactComponentMethod from '../utils/isReactComponentMethod';
import type Documentation from '../Documentation';
import { shallowIgnoreVisitors } from '../utils/traverse';
import resolveToValue from '../utils/resolveToValue';
import type { NodePath, Scope } from '@babel/traverse';
import { visitors } from '@babel/traverse';
import type {
  AssignmentExpression,
  BlockStatement,
  Identifier,
  ObjectExpression,
} from '@babel/types';
import type { ComponentNode } from '../resolver';
import type { Handler } from '.';
import {
  isReactBuiltinCall,
  isReactForwardRefCall,
  isStatelessComponent,
} from '../utils';
import findFunctionReturn from '../utils/findFunctionReturn';

/**
 * The following values/constructs are considered methods:
 *
 * - Method declarations in classes (except "constructor" and React lifecycle
 *   methods
 * - Public class fields in classes whose value are a functions
 * - Object properties whose values are functions
 */
function isMethod(path: NodePath): path is MethodNodePath {
  let isProbablyMethod =
    (path.isClassMethod() && path.node.kind !== 'constructor') ||
    path.isObjectMethod();

  if (
    !isProbablyMethod &&
    (path.isClassProperty() || path.isObjectProperty())
  ) {
    const value = resolveToValue(path.get('value') as NodePath);

    isProbablyMethod = value.isFunction();
  }

  return isProbablyMethod && !isReactComponentMethod(path);
}

interface TraverseState {
  readonly scope: Scope | undefined;
  readonly name: string;
  methods: Array<NodePath<AssignmentExpression>>;
}

const explodedVisitors = visitors.explode<TraverseState>({
  ...shallowIgnoreVisitors,

  AssignmentExpression: {
    enter: function (assignmentPath, state) {
      const { name, scope } = state;
      const left = assignmentPath.get('left');
      const binding = assignmentPath.scope.getBinding(name);

      if (
        binding &&
        left.isMemberExpression() &&
        left.get('object').isIdentifier() &&
        (left.node.object as Identifier).name === name &&
        binding.scope === scope &&
        resolveToValue(assignmentPath.get('right')).isFunction()
      ) {
        state.methods.push(assignmentPath);
      }
      assignmentPath.skip();
    },
  },
});

interface MethodDefinition {
  path: MethodNodePath;
  isStatic?: boolean;
}

interface TraverseImperativeHandleState {
  results: MethodNodePath[];
}

function isObjectExpression(path: NodePath): boolean {
  return path.isObjectExpression();
}

const explodedImperativeHandleVisitors =
  visitors.explode<TraverseImperativeHandleState>({
    ...shallowIgnoreVisitors,

    CallExpression: {
      enter: function (path, state) {
        if (!isReactBuiltinCall(path, 'useImperativeHandle')) {
          return path.skip();
        }

        // useImperativeHandle(ref, () => ({ name: () => {}, ...}))
        const arg = path.get('arguments')[1];

        if (arg && !arg.isFunction()) {
          return path.skip();
        }

        const body = resolveToValue(arg.get('body') as NodePath);

        let definition: NodePath<ObjectExpression> | undefined;

        if (body.isObjectExpression()) {
          definition = body;
        } else {
          definition = findFunctionReturn(arg, isObjectExpression) as
            | NodePath<ObjectExpression>
            | undefined;
        }

        // We found the object body, now add all of the properties as methods.
        definition?.get('properties').forEach(p => {
          if (isMethod(p)) {
            state.results.push(p);
          }
        });

        path.skip();
      },
    },
  });

function findStatelessComponentBody(
  componentDefinition: NodePath,
): NodePath<BlockStatement> | undefined {
  if (isStatelessComponent(componentDefinition)) {
    const body = componentDefinition.get('body');

    if (body.isBlockStatement()) {
      return body;
    }
  } else if (isReactForwardRefCall(componentDefinition)) {
    const inner = resolveToValue(componentDefinition.get('arguments')[0]);

    return findStatelessComponentBody(inner);
  }

  return undefined;
}

function findImperativeHandleMethods(
  componentDefinition: NodePath<ComponentNode>,
): MethodDefinition[] {
  const body = findStatelessComponentBody(componentDefinition);

  if (!body) {
    return [];
  }

  const state: TraverseImperativeHandleState = { results: [] };

  body.traverse(explodedImperativeHandleVisitors, state);

  return state.results.map(p => ({ path: p }));
}

function findAssignedMethods(
  path: NodePath,
  idPath: NodePath<Identifier | null | undefined>,
): MethodDefinition[] {
  if (!idPath.hasNode() || !idPath.isIdentifier()) {
    return [];
  }

  const name = idPath.node.name;
  const binding = idPath.scope.getBinding(name);

  if (!binding) {
    return [];
  }

  const scope = binding.scope;
  const state: TraverseState = {
    scope,
    name,
    methods: [],
  };

  path.traverse(explodedVisitors, state);

  return state.methods.map(p => ({ path: p }));
}

/**
 * Extract all flow types for the methods of a react component. Doesn't
 * return any react specific lifecycle methods.
 */
const componentMethodsHandler: Handler = function (
  documentation: Documentation,
  componentDefinition: NodePath<ComponentNode>,
): void {
  // Extract all methods from the class or object.
  let methodPaths: MethodDefinition[] = [];
  const parent = componentDefinition.parentPath;

  if (isReactComponentClass(componentDefinition)) {
    methodPaths = (
      componentDefinition
        .get('body')
        .get('body')
        .filter(isMethod) as MethodNodePath[]
    ).map(p => ({ path: p }));
  } else if (componentDefinition.isObjectExpression()) {
    methodPaths = (
      componentDefinition.get('properties').filter(isMethod) as MethodNodePath[]
    ).map(p => ({ path: p }));

    // Add the statics object properties.
    const statics = getMemberValuePath(componentDefinition, 'statics');

    if (statics && statics.isObjectExpression()) {
      statics.get('properties').forEach(property => {
        if (isMethod(property)) {
          methodPaths.push({
            path: property,
            isStatic: true,
          });
        }
      });
    }
  } else if (
    parent.isVariableDeclarator() &&
    parent.node.init === componentDefinition.node &&
    parent.get('id').isIdentifier()
  ) {
    methodPaths = findAssignedMethods(
      parent.scope.path,
      parent.get('id') as NodePath<Identifier>,
    );
  } else if (
    parent.isAssignmentExpression() &&
    parent.node.right === componentDefinition.node &&
    parent.get('left').isIdentifier()
  ) {
    methodPaths = findAssignedMethods(
      parent.scope.path,
      parent.get('left') as NodePath<Identifier>,
    );
  } else if (componentDefinition.isFunctionDeclaration()) {
    methodPaths = findAssignedMethods(
      parent.scope.path,
      componentDefinition.get('id'),
    );
  }

  const imperativeHandles = findImperativeHandleMethods(componentDefinition);

  if (imperativeHandles) {
    methodPaths = [...methodPaths, ...imperativeHandles];
  }

  documentation.set(
    'methods',
    methodPaths
      .map(({ path: p, isStatic }) => getMethodDocumentation(p, { isStatic }))
      .filter(Boolean),
  );
};

export default componentMethodsHandler;
