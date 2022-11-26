import type { FunctionDeclaration } from '@babel/types';
import { parse } from '../../../tests/utils';
import resolveFunctionDefinitionToReturnValue from '../resolveFunctionDefinitionToReturnValue.js';
import { describe, expect, test } from 'vitest';

describe('resolveFunctionDefinitionToReturnValue', () => {
  test('can resolve easy return statement', () => {
    const path = parse.statement<FunctionDeclaration>(`
        function x () { return "result"; }
    `);

    expect(resolveFunctionDefinitionToReturnValue(path)).toMatchSnapshot();
  });

  test('stops after first return', () => {
    const path = parse.statement<FunctionDeclaration>(`
        function x () { return "first"; return "second"; }
    `);

    expect(resolveFunctionDefinitionToReturnValue(path)).toMatchSnapshot();
  });

  test('ignores return values in other blocks', () => {
    const path = parse.statement<FunctionDeclaration>(`
        function x () {
          const a = function () { return "funcexpr"; }
          const b = () => { return "arrow"; }
          function c () { return "funcdecl"; }
          const d = {
            d() { return "objmthd"; }
          }

          class A {
            method() {
              return "classmthd";
            }
          }

          if (e) {
            return "if";
          } else {
            return "else";
          }
        }
    `);

    expect(resolveFunctionDefinitionToReturnValue(path)).toBeNull();
  });
});
