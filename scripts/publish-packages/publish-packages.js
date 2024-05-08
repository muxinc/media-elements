#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { argv } from 'node:process';
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const nodePath = await realpath(argv[1]);
const modulePath = await realpath(fileURLToPath(import.meta.url));
const isCLI = nodePath === modulePath;

if (isCLI) cliPublish();

export async function cliPublish() {
  const { values } = parseArgs({
    options: {},
    strict: false,
    allowPositionals: true,
  });

  await publish(values);
}

export async function publish() {

  const [remoteVersionsResult, newVersionsResult] = await Promise.all([
    execAsync(`npm view . version -w packages --json`),
    execAsync(`npm pkg get version -w packages --json`),
  ]);

  const remoteVersions = JSON.parse(remoteVersionsResult.stdout);
  const newVersions = JSON.parse(newVersionsResult.stdout);

  for (const [pkg, version] of Object.entries(newVersions)) {
    if (remoteVersions[pkg] === version) {
      console.log(`Skipping ${pkg}@${version} because it's already published`);
      continue;
    }

    console.log(`Publishing ${pkg}@${version}`);
    await execAsync(`npm publish -w ${pkg} --access public --provenance`);
  }
}
