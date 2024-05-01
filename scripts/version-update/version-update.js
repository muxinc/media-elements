#!/usr/bin/env node
import * as fs from 'node:fs/promises';
import { cwd, stdin as input, stdout as output } from 'node:process';
import { parseArgs } from 'node:util';
import * as readline from 'node:readline/promises';
import conventionalRecommendedBump from 'conventional-recommended-bump';
import * as semver from 'semver';
import { isCli } from './utils.js';

if (await isCli(import.meta.url)) cliVersionUpdate();

export async function cliVersionUpdate() {
  const options = {
    'log-level': {
      type: 'string',
      default: 'info',
    },
  };

  const { values, positionals } = parseArgs({
    options,
    strict: false,
    allowPositionals: true,
  });

  let [version] = positionals;
  await versionUpdate(version, values);
}

export async function versionUpdate(bump = 'conventional', opts) {

  const pkg = await JSON.parse(await fs.readFile('package.json', 'utf8'));

  console.log(cwd());

  if (bump === 'conventional') {
    bump = await conventionalRecommendedBump({
      preset: `angular`,
      lernaPackage: pkg.name,
      path: cwd(),
    });
    console.log(bump);
  }

  const newVersion = semver.inc(pkg.version, bump.releaseType);
  const validVersion = semver.valid(newVersion);

  if (validVersion) {
    const rl = readline.createInterface({ input, output });

    const answerPromise = rl.question(` - ${pkg.name}: ${pkg.version} => ${validVersion} ? `);
    rl.write(`${validVersion}`);

    const answer = await answerPromise;
    log(answer, opts);

    rl.close();
  }
}

function log(msg, opts) {
  if (['info', 'verbose'].includes(opts['log-level'])) {
    console.log(msg);
  }
}
