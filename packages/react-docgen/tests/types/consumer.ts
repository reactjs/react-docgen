import { parse, utils } from '../../dist/main.js';
import type { Handler, NodePath, babelTypes } from '../../dist/main.js';

const handler: Handler = (documentation, definition) => {
  const node: babelTypes.Node = definition.node;
  const path: NodePath = definition;

  documentation.set('nodeType', node.type);
  utils.getTypeAnnotation(path);
  utils.traverse.ignore(path);
};

parse('export function Button() { return <button />; }', {
  filename: 'component.tsx',
  handlers: [handler],
  babelOptions: {
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['typescript', 'jsx'] },
  },
});

declare const emptyPath: NodePath<null>;

utils.getTypeAnnotation(emptyPath);
utils.traverse.ignore(emptyPath);
