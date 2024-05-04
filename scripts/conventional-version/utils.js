import * as process from 'node:process';
import { realpath } from 'node:fs/promises'
import { fileURLToPath } from 'node:url';
import promiseSpawn from '@npmcli/promise-spawn';

export async function isCli(metaUrl) {
  const nodePath = await realpath(process.argv[1]);
  const modulePath = await realpath(fileURLToPath(metaUrl));
  return nodePath === modulePath;
}

export async function resolvePair(promiseLike) {
  try {
    const data = await promiseLike;
    return [undefined, data];
  } catch (error) {
    return [error, undefined];
  }
}

export async function cmd(command, opts) {
  const {
    // `pipe` to get stdout and stderr of the command.
    // `inherit` to have an interactive command and log output to the console.
    stdio = 'pipe',
    // how long to wait for a process.kill signal
    // only exposed here so that we can make the test go a bit faster.
    signalTimeout = 500,
  } = opts

  if (opts['log-level'] === 'verbose') {
    console.log(`${command}`);
  }

  let stdout, stderr;

  try {
    ({ stdout, stderr } = await promiseSpawn(command, {
      shell: true,
      ...opts
    }));
  } catch (er) {
    const { signal } = er
    // coverage disabled because win32 never emits signals
    /* istanbul ignore next */
    if (stdio === 'inherit' && signal) {
      // by the time we reach here, the child has already exited. we send the
      // signal back to ourselves again so that npm will exit with the same
      // status as the child
      process.kill(process.pid, signal)

      // just in case we don't die, reject after 500ms
      // this also keeps the node process open long enough to actually
      // get the signal, rather than terminating gracefully.
      return new Promise((res, rej) => setTimeout(() => rej(er), signalTimeout))
    } else {
      throw er
    }
  }

  if (stderr) {
    if (opts['log-level'] !== 'silent') {
      console.error(`\n${stderr}`);
    }
  }

  return stdout.trim();
}
