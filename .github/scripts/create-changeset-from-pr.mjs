#!/usr/bin/env node
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
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

if (!prTitle) {
  console.error('PR title is required.');
  process.exit(1);
}

if (!['add-changeset', 'add-changeset-major'].includes(labelName)) {
  console.log(`Skipping changeset creation because label ${labelName || 'unknown'} was not handled.`);
  process.exit(0);
}

const message = [prTitle, prBody].filter(Boolean).join('\n');

let releaseType = 'patch';

if (labelName === 'add-changeset-major') {
  releaseType = 'major';
} else if (/^(feat|feature)(\([^)]+\))?!?:/i.test(message)) {
  releaseType = 'minor';
} else if (/^(fix|perf|refactor|build|ci|chore|docs|style|test|revert)(\([^)]+\))?!?:/i.test(message)) {
  releaseType = 'patch';
} else if (/\bbreaking change\b|!:/i.test(message)) {
  releaseType = 'major';
}

const fileName = `pr-${prNumber}.md`;
const filePath = path.join(changesetDir, fileName);

const existingFiles = await readdir(changesetDir);
await Promise.all(
  existingFiles
    .filter((name) => name.startsWith(`pr-${prNumber}`) && name.endsWith('.md'))
    .map((name) => rm(path.join(changesetDir, name), { force: true }))
);

const packages = ["react-docgen", "react-docgen-cli"];
const frontmatter = packages.map((pkg) => `"${pkg}": ${releaseType}`).join('\n');
const content = `---\n${frontmatter}\n---\n\n${prTitle}\n`;

await mkdir(changesetDir, { recursive: true });
await writeFile(filePath, content, 'utf8');

console.log(`Created changeset ${path.relative(repoRoot, filePath)} with release type ${releaseType}.`);
