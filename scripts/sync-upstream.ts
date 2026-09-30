/**
 * Moves each project's pinned revision to the tip of its upstream default
 * branch and refreshes the blob ids recorded for explicitly listed pages.
 *
 * The site keeps a pinned copy of every imported page so that a reader can
 * always tell which upstream state it came from. Pinning is not the same as
 * freezing: this is the step that advances the pin. It rewrites the revision
 * constants and the recorded blobs in packages/project-data and nothing else;
 * the import, the manifest and the build then regenerate every derived file.
 * The scheduled sync workflow runs it and opens a pull request with the
 * result, so a person still decides whether the new state is published.
 *
 * Usage: node --experimental-strip-types scripts/sync-upstream.ts <clone-dir>
 *
 * The clone directory holds ori-lang/, aipo-lang/, oride/ and prumo/.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const cloneRoot = process.argv[2];

if (!cloneRoot) {
  console.error('Usage: sync-upstream.ts <dir with ori-lang/, aipo-lang/, oride/, prumo/>');
  process.exit(1);
}

const target = path.join(import.meta.dirname, '..', 'packages/project-data/src/documentation.ts');

const clones: Record<string, string> = {
  ORI_REVISION: 'ori-lang',
  AIPO_REVISION: 'aipo-lang',
  ORIDE_REVISION: 'oride',
  PRUMO_REVISION: 'prumo',
};

function git(clone: string, ...args: string[]): string {
  return execFileSync('git', ['-C', path.join(cloneRoot, clone), ...args], {
    encoding: 'utf8',
  }).trim();
}

let source = readFileSync(target, 'utf8');
const moved: string[] = [];

for (const [constant, clone] of Object.entries(clones)) {
  const tip = git(clone, 'rev-parse', 'HEAD');
  const pattern = new RegExp(`(export const ${constant} = ')([0-9a-f]{40})(')`, 'u');
  const current = source.match(pattern)?.[2];

  if (!current) {
    console.error(`${constant} not found in ${target}`);
    process.exit(1);
  }

  if (current !== tip) {
    source = source.replace(pattern, `$1${tip}$3`);
    moved.push(`${clone}: ${current.slice(0, 7)} -> ${tip.slice(0, 7)}`);
  }

  // Pages listed by hand record the blob they were reviewed at; those move
  // with the revision so the list keeps describing what is published.
  source = source.replace(
    /(sourcePath|englishSourcePath): '([^']+)',\n(\s+)(sourceBlob|englishSourceBlob): '[0-9a-f]{40}'/gu,
    (match, key: string, file: string, indent: string, blobKey: string) => {
      const owner = source.lastIndexOf('revision: ', source.indexOf(match));
      const revisionConstant = source.slice(owner).match(/revision: ([A-Z_]+)/u)?.[1];

      if (revisionConstant !== constant) {
        return match;
      }

      try {
        return `${key}: '${file}',\n${indent}${blobKey}: '${git(clone, 'rev-parse', `${tip}:${file}`)}'`;
      } catch {
        console.error(`${clone}: ${file} no longer exists at ${tip.slice(0, 7)}`);
        process.exit(1);
      }
    },
  );
}

writeFileSync(target, source, 'utf8');
console.log(moved.length === 0 ? 'Every pin is already at the upstream tip.' : moved.join('\n'));
