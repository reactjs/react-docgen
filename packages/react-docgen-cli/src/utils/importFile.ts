import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const resolveOptions = { paths: [process.cwd()] };

export default async function importFile<T>(
  importSpecifier: string,
): Promise<T | undefined> {
  try {
    const importedFile = await import(
      // need to convert to file:// url as on windows absolute path strings do not work
      pathToFileURL(require.resolve(importSpecifier, resolveOptions)).href
    );

    return importedFile.default ? importedFile.default : importedFile;
  } catch (error) {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code !== 'ERR_MODULE_NOT_FOUND' &&
      (error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND'
    ) {
      throw error;
    }

    return undefined;
  }
}
