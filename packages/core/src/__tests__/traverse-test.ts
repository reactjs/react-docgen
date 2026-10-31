import { describe, expect, test } from 'vitest';
import { AstPath, traverse, type AstNode, type VisitorKeys } from '../index.js';

const visitorKeys: VisitorKeys = {
  Identifier: [],
  Program: ['body'],
  Wrapper: ['value'],
};

const ast: AstNode = {
  type: 'Program',
  body: [
    { type: 'Identifier', name: 'first' },
    {
      type: 'Wrapper',
      value: { type: 'Identifier', name: 'nested' },
    },
    { type: 'Identifier', name: 'last' },
  ],
};

describe('AstPath', () => {
  test('addresses node and list children', () => {
    const root = new AstPath({ node: ast });
    const body = root.get('body');

    expect(body).toHaveLength(3);
    expect((body as AstPath[])[0]).toMatchObject({
      key: 0,
      listKey: 'body',
      parentPath: root,
    });
    expect((body as AstPath[])[1]?.get('value')).toMatchObject({
      key: 'value',
      listKey: null,
      parentPath: (body as AstPath[])[1],
    });
    expect(root.get('missing')).toBeNull();
  });
});

describe('traverse', () => {
  test('visits nodes in enter/exit order', () => {
    const visited: string[] = [];

    traverse(
      ast,
      visitorKeys,
      {
        enter(path) {
          visited.push(`enter:${path.node.type}`);
        },
        exit(path) {
          visited.push(`exit:${path.node.type}`);
        },
      },
      undefined,
    );

    expect(visited).toEqual([
      'enter:Program',
      'enter:Identifier',
      'exit:Identifier',
      'enter:Wrapper',
      'enter:Identifier',
      'exit:Identifier',
      'exit:Wrapper',
      'enter:Identifier',
      'exit:Identifier',
      'exit:Program',
    ]);
  });

  test('supports type visitors, skip, stop, and state', () => {
    const names: string[] = [];

    traverse(
      ast,
      visitorKeys,
      {
        Identifier(path, state) {
          state.push(path.node.name as string);

          if (path.node.name === 'last') {
            path.stop();
          }
        },
        Wrapper(path) {
          path.skip();
        },
      },
      names,
    );

    expect(names).toEqual(['first', 'last']);
  });
});
