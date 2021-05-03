import { statement, noopImporter } from '../../../tests/utils';
import resolveExportDeclaration from '../resolveExportDeclaration';
import { NodePath } from 'ast-types/lib/node-path';

jest.mock('../resolveToValue', () => {
  return (path: NodePath) => path;
});

describe('resolveExportDeclaration', () => {
  it('resolves default exports', () => {
    const exp = statement('export default 42;');
    const resolved = resolveExportDeclaration(exp, noopImporter);

    expect(resolved).toEqual([exp.get('declaration')]);
  });

  it('resolves named variable exports', () => {
    const exp = statement('export var foo = 42, bar = 21;');
    const resolved = resolveExportDeclaration(exp, noopImporter);

    const declarations = exp.get('declaration', 'declarations');
    expect(resolved).toEqual([declarations.get(0), declarations.get(1)]);
  });

  it('resolves named function exports', () => {
    const exp = statement('export function foo(){}');
    const resolved = resolveExportDeclaration(exp, noopImporter);

    expect(resolved).toEqual([exp.get('declaration')]);
  });

  it('resolves named class exports', () => {
    const exp = statement('export class Foo {}');
    const resolved = resolveExportDeclaration(exp, noopImporter);

    expect(resolved).toEqual([exp.get('declaration')]);
  });

  it('resolves named exports', () => {
    const exp = statement('export {foo, bar, baz}; var foo, bar, baz;');
    const resolved = resolveExportDeclaration(exp, noopImporter);

    const specifiers = exp.get('specifiers');
    expect(resolved).toEqual([
      specifiers.get(0, 'local'),
      specifiers.get(1, 'local'),
      specifiers.get(2, 'local'),
    ]);
  });

  it('resolves named exports from', () => {
    const exp = statement('export {foo, bar, baz} from "";');
    const resolved = resolveExportDeclaration(exp, noopImporter);

    const specifiers = exp.get('specifiers');
    expect(resolved).toEqual([
      specifiers.get(0, 'local'),
      specifiers.get(1, 'local'),
      specifiers.get(2, 'local'),
    ]);
  });
});
