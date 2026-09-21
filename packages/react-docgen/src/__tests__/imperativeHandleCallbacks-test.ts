import { parse } from '../main.js';
import { describe, expect, test } from 'vitest';

function parseSource(source: string) {
  return parse(source, {
    filename: 'file.tsx',
    babelOptions: { babelrc: false },
  });
}

const method = {
  name: '_myMethod',
  params: [{ name: 'argument', optional: false, type: { name: 'string' } }],
  returns: { type: { name: 'number' } },
};

describe('useImperativeHandle methods', () => {
  // The component reported in
  // https://github.com/reactjs/react-docgen/issues/856, verbatim.
  test('documents a useCallback method of a memo(forwardRef) component', () => {
    const docs = parseSource(`
      import React, {
        forwardRef,
        memo,
        useCallback,
        useImperativeHandle,
        useMemo,
        useRef,
      } from 'react';

      export const MyComponent =
      memo(forwardRef((_, ref) => {

        const _myMethod = useCallback((argument:string) : number => {});

        useImperativeHandle(
          ref,
          () => ({
              /** myMethod description */
              _myMethod,
          }),
          [],
        );

        return <div />;
      }));
    `);

    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      methods: [
        {
          ...method,
          docblock: 'myMethod description',
          description: 'myMethod description',
        },
      ],
    });
  });

  test('documents a useCallback method of a forwardRef component', () => {
    const docs = parseSource(`
      import React, { forwardRef, useCallback, useImperativeHandle } from 'react';

      export const MyComponent = forwardRef((_, ref) => {
        const _myMethod = useCallback((argument: string): number => 1, []);

        useImperativeHandle(ref, () => ({ _myMethod }), []);

        return <div />;
      });
    `);

    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ methods: [method] });
  });

  test('documents a plain function method of a memo(forwardRef) component (control)', () => {
    // Controls for the wrapper resolution itself: the same component without
    // useCallback is documented before this change, so the two tests above
    // fail on the unwrapping and not on memo/forwardRef.
    const docs = parseSource(`
      import React, { forwardRef, memo, useImperativeHandle } from 'react';

      export const MyComponent = memo(forwardRef((_, ref) => {
        const _myMethod = (argument: string): number => 1;

        useImperativeHandle(ref, () => ({ _myMethod }), []);

        return <div />;
      }));
    `);

    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ methods: [method] });
  });
});
