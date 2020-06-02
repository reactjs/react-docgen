import getMemberValuePath from '../utils/getMemberValuePath';
import type { MethodNodePath } from '../utils/getMethodDocumentation';
import getMethodDocumentation from '../utils/getMethodDocumentation';
import isReactBuiltinCall from '../utils/isReactBuiltinCall';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactComponentMethod from '../utils/isReactComponentMethod';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import type Documentation from '../Documentation';
import { shallowIgnoreVisitors } from '../utils/traverse';
import resolveToValue from '../utils/resolveToValue';
import type { NodePath, Scope } from '@babel/traverse';
import { visitors } from '@babel/traverse';
import type { AssignmentExpression, Identifier, Property } from '@babel/types';
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

// Finding the component itself depends heavily on how it's exported.
// Conversely, finding any 'useImperativeHandle()' methods requires digging
// through intervening assignments, declarations, and optionally a
// React.forwardRef() call.
function findUnderlyingComponentDefinition(
  componentDefinition: NodePath<ComponentNode>,
) {
  let path: NodePath | null = componentDefinition;
  let keepDigging = true;
  let sawForwardRef = false;

  // We can't use 'visit', because we're not necessarily climbing "down" the
  // AST, we're following the logic flow *backwards* to the component
  // definition. Once we do find what looks like the underlying functional
  // component definition, *then* we can 'visit' downwards to find the call to
  // useImperativeHandle, if it exists.
  while (keepDigging && path) {
    // Using resolveToValue automatically gets the "value" from things like
    // assignments or identifier references.  Putting this here removes the need
    // to call it in a bunch of places on a per-type basis.
    const value = resolveToValue(path);

    if (value.isVariableDeclaration()) {
      const decls: NodePath[] = value.get('declarations');

      if (decls.length == 1) {
        path = decls[0];
      } else {
        path = null;
      }
    } else if (value.isExpressionStatement()) {
      path = value.get('expression');
    } else if (value.isCallExpression()) {
      if (isReactForwardRefCall(value) && !sawForwardRef) {
        sawForwardRef = true;
        path = value.get('arguments')[0];
      } else {
        path = null;
      }
    } else if (
      value.isArrowFunctionExpression() ||
      value.isFunctionDeclaration() ||
      value.isFunctionExpression()
    ) {
      if (value.isArrowFunctionExpression()) {
        path = value.get('body');
      } else if (value.isFunctionDeclaration()) {
        path = value.get('body');
      } else if (value.isFunctionExpression()) {
        path = value.get('body');
      }

      keepDigging = false;
    } else {
      // Any other type causes us to bail.
      path = null;
    }
  }

  return path;
}

function findImperativeHandleMethods(
  componentDefinition: NodePath<ComponentNode>,
): Array<NodePath<Property>> {
  const path = findUnderlyingComponentDefinition(componentDefinition);

  if (!path) {
    return [];
  }

  const results: Array<NodePath<Property>> = [];

  path.traverse({
    CallExpression: function (callPath) {
      // console.log('* call expression...');
      // We're trying to handle calls to React's useImperativeHandle.  If this
      // isn't, we can stop visiting this node path immediately.
      if (!isReactBuiltinCall(callPath, 'useImperativeHandle')) {
        return false;
      }

      // The standard use (and documented example) is:
      //
      //   useImperativeHandle(ref, () => ({ name: () => {}, ...}))
      //                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //
      // ... so we only handle a second argument (index 1) that is an
      // ArrowFunctionExpression and whose body is an ObjectExpression.
      const arg = callPath.get('arguments')[1];

      if (!arg.isArrowFunctionExpression()) {
        return false;
      }

      const body = arg.get('body');

      if (!body.isObjectExpression()) {
        return false;
      }

      // We found the object body, now add all of the properties as methods.
      body.get('properties').forEach(p => {
        if (p.isObjectProperty()) {
          results.push(p);
        }
      });

      return false;
    },
  });

  return results;
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
  let methodPaths: Array<{
    path: MethodNodePath;
    isStatic?: boolean;
  }> = [];

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

  // Also look for any methods that come from useImperativeHandle() calls.
  const impMethodPaths = findImperativeHandleMethods(componentDefinition);

  if (impMethodPaths && impMethodPaths.length > 0) {
    methodPaths = methodPaths.concat(
      impMethodPaths.map(p => ({ path: p as MethodNodePath })),
    );
  }

  documentation.set(
    'methods',
    methodPaths
      .map(({ path: p, isStatic }) => getMethodDocumentation(p, { isStatic }))
      .filter(Boolean),
  );
};

export default componentMethodsHandler;
