import { argv } from 'node:process';
import { realpath } from 'node:fs/promises'
import { fileURLToPath } from 'node:url';
import child_process from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(child_process.exec);

export async function isCli(metaUrl) {
  const nodePath = await realpath(argv[1]);
  const modulePath = await realpath(fileURLToPath(metaUrl));
  return nodePath === modulePath;
}

export async function cmd(command, opts) {
  command = command.trim().replace(/\s+/g, ' ');

  if (opts['log-level'] === 'verbose') {
    console.log(`${command}`);
  }

  const { stdout, stderr } = await exec(command);

  if (stderr) {
    if (opts['log-level'] !== 'silent') {
      console.error(`\n${stderr}`);
    }
  }

  return stdout.trim();
}

export async function resolvePair(promiseLike) {
  try {
    const data = await promiseLike;
    return [undefined, data];
  } catch (error) {
    return [error, undefined];
  }
}
