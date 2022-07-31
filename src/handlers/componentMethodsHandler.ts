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
import type { AssignmentExpression, Identifier } from '@babel/types';
import type { ComponentNode } from '../resolver';
import type { Handler } from '.';

/**
 * The following values/constructs are considered methods:
 *
 * - Method declarations in classes (except "constructor" and React lifecycle
 *   methods
 * - Public class fields in classes whose value are a functions
 * - Object properties whose values are functions
 */
function isMethod(path: NodePath): boolean {
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
        left.isMemberExpression() &&
        left.get('object').isIdentifier() &&
        (left.node.object as Identifier).name === name &&
        binding &&
        binding.scope === scope &&
        resolveToValue(assignmentPath.get('right')).isFunction()
      ) {
        state.methods.push(assignmentPath);
      }
      assignmentPath.skip();
    },
  },
});

function findAssignedMethods(
  path: NodePath,
  idPath: NodePath<Identifier | null | undefined>,
): Array<NodePath<AssignmentExpression>> {
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

  return state.methods;
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
  let methodPaths: Array<{ path: MethodNodePath; isStatic?: boolean }> = [];

  if (isReactComponentClass(componentDefinition)) {
    methodPaths = (
      componentDefinition
        .get('body')
        .get('body')
        .filter(body => isMethod(body)) as MethodNodePath[]
    ).map(p => ({ path: p }));
  } else if (componentDefinition.isObjectExpression()) {
    methodPaths = (
      componentDefinition
        .get('properties')
        .filter(props => isMethod(props)) as MethodNodePath[]
    ).map(p => ({ path: p }));

    // Add the statics object properties.
    const statics = getMemberValuePath(componentDefinition, 'statics');

    if (statics && statics.isObjectExpression()) {
      statics.get('properties').forEach(property => {
        if (isMethod(property)) {
          methodPaths.push({
            path: property as MethodNodePath,
            isStatic: true,
          });
        }
      });
    }
  } else if (
    componentDefinition.parentPath &&
    componentDefinition.parentPath.isVariableDeclarator() &&
    componentDefinition.parentPath.node.init === componentDefinition.node &&
    componentDefinition.parentPath.get('id').isIdentifier()
  ) {
    methodPaths = findAssignedMethods(
      componentDefinition.parentPath.scope.path,
      componentDefinition.parentPath.get('id') as NodePath<Identifier>,
    ).map(p => ({ path: p }));
  } else if (
    componentDefinition.parentPath &&
    componentDefinition.parentPath.isAssignmentExpression() &&
    componentDefinition.parentPath.node.right === componentDefinition.node &&
    componentDefinition.parentPath.get('left').isIdentifier()
  ) {
    methodPaths = findAssignedMethods(
      componentDefinition.parentPath.scope.path,
      componentDefinition.parentPath.get('left') as NodePath<Identifier>,
    ).map(p => ({ path: p }));
  } else if (componentDefinition.isFunctionDeclaration()) {
    methodPaths = findAssignedMethods(
      componentDefinition.parentPath.scope.path,
      componentDefinition.get('id'),
    ).map(p => ({ path: p }));
  }

  documentation.set(
    'methods',
    methodPaths
      .map(({ path: p, isStatic }) => getMethodDocumentation(p, { isStatic }))
      .filter(Boolean),
  );
};

export default componentMethodsHandler;
