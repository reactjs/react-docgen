import { describe, expect, test, vi } from 'vitest';
import { ProjectContext, type Parser } from '../index.js';

describe('ProjectContext', () => {
  test('selects a parser for every imported file', () => {
    const typescript: Parser = {
      parse: ({ filename }) => ({ type: 'TypeScriptFile', filename }),
      visitorKeys: {},
    };
    const hermes: Parser = {
      parse: ({ filename }) => ({ type: 'HermesFile', filename }),
      visitorKeys: {},
    };
    const selectParser = vi.fn((filename: string) =>
      filename.endsWith('.tsx') ? typescript : hermes,
    );
    const importer = vi.fn(() => ({
      code: 'export default function Button() {}',
      filename: '/project/Button.js',
    }));
    const project = new ProjectContext({ importer, selectParser });

    const entry = project.parse({ code: '', filename: '/project/App.tsx' });
    const imported = entry.import('./Button.js');

    expect(entry.ast.type).toBe('TypeScriptFile');
    expect(imported.ast.type).toBe('HermesFile');
    expect(selectParser).toHaveBeenCalledWith('/project/App.tsx');
    expect(selectParser).toHaveBeenCalledWith('/project/Button.js');
    expect(importer).toHaveBeenCalledWith('./Button.js', '/project/App.tsx');
  });
});
