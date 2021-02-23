import { namedTypes as t } from 'ast-types';
import getClassMemberValuePath from './getClassMemberValuePath';
import getMemberExpressionValuePath from './getMemberExpressionValuePath';
import getPropertyValuePath from './getPropertyValuePath';
import resolveFunctionDefinitionToReturnValue from '../utils/resolveFunctionDefinitionToReturnValue';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

const SYNONYMS = {
  getDefaultProps: 'defaultProps',
  defaultProps: 'getDefaultProps',
};

const postprocessPropTypes = (path, importer) =>
  t.Function.check(path.node)
    ? resolveFunctionDefinitionToReturnValue(path, importer)
    : path;

const POSTPROCESS_MEMBERS = new Map([['propTypes', postprocessPropTypes]]);

const LOOKUP_METHOD = new Map([
  // @ts-ignore
  [t.ArrowFunctionExpression.name, getMemberExpressionValuePath],
  // @ts-ignore
  [t.CallExpression.name, getMemberExpressionValuePath],
  // @ts-ignore
  [t.FunctionExpression.name, getMemberExpressionValuePath],
  // @ts-ignore
  [t.FunctionDeclaration.name, getMemberExpressionValuePath],
  // @ts-ignore
  [t.VariableDeclaration.name, getMemberExpressionValuePath],
  // @ts-ignore
  [t.ObjectExpression.name, getPropertyValuePath],
  // @ts-ignore
  [t.ClassDeclaration.name, getClassMemberValuePath],
  // @ts-ignore
  [t.ClassExpression.name, getClassMemberValuePath],
]);

export function isSupportedDefinitionType({ node }: NodePath): boolean {
  return (
    t.ObjectExpression.check(node) ||
    t.ClassDeclaration.check(node) ||
    t.ClassExpression.check(node) ||
    /**
     * Adds support for libraries such as
     * [styled components]{@link https://github.com/styled-components} that use
     * TaggedTemplateExpression's to generate components.
     *
     * While react-docgen's built-in resolvers do not support resolving
     * TaggedTemplateExpression definitions, third-party resolvers (such as
     * https://github.com/Jmeyering/react-docgen-annotation-resolver) could be
     * used to add these definitions.
     */
    t.TaggedTemplateExpression.check(node) ||
    // potential stateless function component
    t.VariableDeclaration.check(node) ||
    t.ArrowFunctionExpression.check(node) ||
    t.FunctionDeclaration.check(node) ||
    t.FunctionExpression.check(node) ||
    /**
     * Adds support for libraries such as
     * [system-components]{@link https://jxnblk.com/styled-system/system-components} that use
     * CallExpressions to generate components.
     *
     * While react-docgen's built-in resolvers do not support resolving
     * CallExpressions definitions, third-party resolvers (such as
     * https://github.com/Jmeyering/react-docgen-annotation-resolver) could be
     * used to add these definitions.
     */
    t.CallExpression.check(node)
  );
}

/**
 * This is a helper method for handlers to make it easier to work either with
 * an ObjectExpression from `React.createClass` class or with a class
 * definition.
 *
 * Given a path and a name, this function will either return the path of the
 * property value if the path is an ObjectExpression, or the value of the
 * ClassProperty/MethodDefinition if it is a class definition (declaration or
 * expression).
 *
 * It also normalizes the names so that e.g. `defaultProps` and
 * `getDefaultProps` can be used interchangeably.
 */
export default function getMemberValuePath(
  componentDefinition: NodePath,
  memberName: string,
  importer: Importer,
): NodePath | null {
  if (!isSupportedDefinitionType(componentDefinition)) {
    throw new TypeError(
      'Got unsupported definition type. Definition must be one of ' +
        'ObjectExpression, ClassDeclaration, ClassExpression,' +
        'VariableDeclaration, ArrowFunctionExpression, FunctionExpression, ' +
        'TaggedTemplateExpression, FunctionDeclaration or CallExpression. Got "' +
        componentDefinition.node.type +
        '" instead.',
    );
  }

  const lookupMethod =
    LOOKUP_METHOD.get(componentDefinition.node.type) ||
    getMemberExpressionValuePath;
  let result = lookupMethod(componentDefinition, memberName, importer);
  if (!result && SYNONYMS[memberName]) {
    result = lookupMethod(componentDefinition, SYNONYMS[memberName], importer);
  }
  const postprocessMethod = POSTPROCESS_MEMBERS.get(memberName);
  if (result && postprocessMethod) {
    result = postprocessMethod(result, importer);
  }

  return result;
}
