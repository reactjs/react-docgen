#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const changesetDir = path.join(repoRoot, '.changeset');

const prNumber = process.env.PR_NUMBER?.trim() ?? 'unknown';
const prTitle = process.env.PR_TITLE?.trim() ?? '';
const prBody = process.env.PR_BODY?.trim() ?? '';
const labelName = process.env.LABEL_NAME?.trim().toLowerCase() ?? '';
const baseSha = process.env.BASE_SHA?.trim() ?? '';
const headSha = process.env.HEAD_SHA?.trim() ?? '';

if (!prTitle) {
  console.error('PR title is required.');
  process.exit(1);
}

if (!['add-changeset', 'add-changeset-major'].includes(labelName)) {
  console.log(
    `Skipping changeset creation because label ${labelName || 'unknown'} was not handled.`,
  );
  process.exit(0);
}

const message = [prTitle, prBody].filter(Boolean).join('\n');

let releaseType = 'patch';

if (labelName === 'add-changeset-major') {
  releaseType = 'major';
} else if (/^(feat|feature)(\([^)]+\))?!?:/i.test(message)) {
  releaseType = 'minor';
} else if (
  /^(fix|perf|refactor|build|ci|chore|docs|style|test|revert)(\([^)]+\))?!?:/i.test(
    message,
  )
) {
  releaseType = 'patch';
} else if (/\bbreaking change\b|!:/i.test(message)) {
  releaseType = 'major';
}

const workspacePackages = await getWorkspacePackages(repoRoot);
const affectedPackages = await getAffectedPackages(
  repoRoot,
  workspacePackages,
  baseSha,
  headSha,
);

if (affectedPackages.length === 0) {
  console.log(
    'No workspace packages were detected from the PR diff; skipping changeset creation.',
  );
  process.exit(0);
}

await mkdir(changesetDir, { recursive: true });
const existingFiles = await listChangesetFiles(changesetDir);

execFileSync(
  'pnpm',
  ['exec', 'changeset', 'add', '--empty', '--message', prTitle],
  {
    cwd: repoRoot,
    stdio: 'pipe',
  },
);

const createdChangesetFile = await getNewestChangesetFile(
  changesetDir,
  existingFiles,
);

if (!createdChangesetFile) {
  console.error('Changesets CLI did not create a changeset file.');
  process.exit(1);
}

const filePath = path.join(changesetDir, createdChangesetFile);
const frontmatter = affectedPackages
  .map((pkg) => `"${pkg}": ${releaseType}`)
  .join('\n');
const content = `---\n${frontmatter}\n---\n\n${prTitle}\n`;

await writeFile(filePath, content, 'utf8');

console.log(
  `Created changeset ${path.relative(repoRoot, filePath)} for ${affectedPackages.join(', ')} with release type ${releaseType}.`,
);

async function getWorkspacePackages(repoRootPath) {
  const packagesDir = path.join(repoRootPath, 'packages');
  const entries = await readdir(packagesDir, { withFileTypes: true });

  return (
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const packageJsonPath = path.join(
            packagesDir,
            entry.name,
            'package.json',
          );

          try {
            const packageJsonContent = await readFile(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageJsonContent);

            return packageJson.name
              ? { name: packageJson.name, dirName: entry.name }
              : null;
          } catch {
            return null;
          }
        }),
    )
  ).filter(Boolean);
}

async function getAffectedPackages(
  repoRootPath,
  workspacePackagesList,
  baseShaValue,
  headShaValue,
) {
  const changedFiles = await getChangedFiles(
    repoRootPath,
    baseShaValue,
    headShaValue,
  );
  const affectedPackageNames = new Set();
  const ignoredPackages = new Set([
    '@react-docgen-internal/benchmark',
    '@react-docgen-internal/website',
  ]);

  for (const changedFile of changedFiles) {
    const normalizedPath = changedFile.replace(/\\/g, '/');
    const rootChanges = [
      'package.json',
      'pnpm-workspace.yaml',
      'nx.json',
      'tsconfig.base.json',
      'pnpm-lock.yaml',
    ];

    if (rootChanges.includes(normalizedPath)) {
      for (const workspacePackage of workspacePackagesList) {
        if (!ignoredPackages.has(workspacePackage.name)) {
          affectedPackageNames.add(workspacePackage.name);
        }
      }
      continue;
    }

    for (const workspacePackage of workspacePackagesList) {
      const packagePrefix = `packages/${workspacePackage.dirName}/`;

      if (
        !ignoredPackages.has(workspacePackage.name) &&
        (normalizedPath === `packages/${workspacePackage.dirName}` ||
          normalizedPath.startsWith(packagePrefix))
      ) {
        affectedPackageNames.add(workspacePackage.name);
      }
    }
  }

  return [...affectedPackageNames].sort();
}

async function getChangedFiles(repoRootPath, baseShaValue, headShaValue) {
  const baseRef = baseShaValue || 'HEAD~1';
  const headRef = headShaValue || 'HEAD';

  try {
    const diffOutput = execFileSync(
      'git',
      ['diff', '--name-only', baseRef, headRef],
      {
        cwd: repoRootPath,
        encoding: 'utf8',
      },
    );
    const files = diffOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (files.length > 0) {
      return files;
    }
  } catch {
    // fall through to the working tree state below
  }

  try {
    const statusOutput = execFileSync('git', ['status', '--porcelain'], {
      cwd: repoRootPath,
      encoding: 'utf8',
    });

    return statusOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.slice(3).trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function listChangesetFiles(changesetDirectory) {
  const entries = await readdir(changesetDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();
}

async function getNewestChangesetFile(changesetDirectory, existingFiles) {
  const currentFiles = await listChangesetFiles(changesetDirectory);
  const newFiles = currentFiles.filter((file) => !existingFiles.includes(file));

  if (newFiles.length === 0) {
    return null;
  }

  const filesWithStats = await Promise.all(
    newFiles.map(async (file) => ({
      name: file,
      mtimeMs: (await stat(path.join(changesetDirectory, file))).mtimeMs,
    })),
  );

  filesWithStats.sort((left, right) => right.mtimeMs - left.mtimeMs);

  return filesWithStats[0]?.name ?? null;
}
