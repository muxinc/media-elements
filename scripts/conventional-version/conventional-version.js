#!/usr/bin/env node
import { exit, stdin as input, stdout as output } from 'node:process';
import { parseArgs } from 'node:util';
import * as readline from 'node:readline/promises';
import chalk from 'chalk';

import conventionalRecommendedBump from 'conventional-recommended-bump';
import * as semver from 'semver';
import { isCli, cmd } from './utils.js';

if (await isCli(import.meta.url)) cliConventionalVersion();

export async function cliConventionalVersion() {
  const options = {
    branch: {
      type: 'string',
      short: 'b',
      default: 'main',
    },
    workspace: {
      type: 'string',
      short: 'w',
      default: 'packages',
    },
    interactive: {
      type: 'boolean',
      short: 'i',
    },
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
  await conventionalVersion(version, values);
}

export async function conventionalVersion(bump = 'conventional', opts) {
  let branch = await cmd('git rev-parse --abbrev-ref HEAD', opts);

  if (branch !== opts.branch) {
    // Git tags point to the commit. If you squash commits on PR merge, the tags will be lost.
    log(`You must be on the ${opts.branch} branch. Aborting.`, opts);
    exit(1);
  }

  log('Looking for changed packages...\n', opts);

  const rl = readline.createInterface({ input, output });

  const execCmd = `node -p "process.env.npm_package_name+\\":\\"+process.env.PWD"`;

  const [packagesPaths, packagesJson] = await Promise.all([
    // Get the package name:path of the workspaces
    cmd(`npm exec -w ${opts.workspace} -c '${execCmd}'`, opts),
    // Get the package.json's of the workspaces
    cmd(`npm pkg get -w ${opts.workspace}`, opts),
  ]);

  const paths = Object.fromEntries(packagesPaths.split('\n').map((line) => line.split(':')));
  const packagesMap = JSON.parse(packagesJson);
  const pad = Math.max(...Object.keys(packagesMap).map((name) => name.length)) + 4;

  let willUpdate = [];

  for (let pkgName in packagesMap) {
    const pkg = packagesMap[pkgName];

    let validVersion = await getRecommendedBump(bump, pkg, paths[pkgName]);
    // If no version is returned, there are no changes.
    let version = validVersion ?? pkg.version;

    let prefix = `${pkg.name}: `;
    prefix = prefix.padEnd(pad - 2);

    let msg = `${pkg.version} → ${colorizeDiff(pkg.version, version)}`;
    msg = `${prefix}${msg}`;

    if (opts.interactive) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const newVersionPromise = rl.question(` - ${msg} ? `);
        rl.write(`${version}`);

        const newVersion = await newVersionPromise;
        const validManualVersion = semver.valid(newVersion);

        if (validManualVersion) {
          willUpdate.push({
            name: pkg.name,
            version: validManualVersion,
          });
          break;
        } else {
          log(`Try again. Invalid version: ${newVersion}`, opts);
        }
      }
    } else {
      log(` - ${msg}`, opts);

      willUpdate.push({
        name: pkg.name,
        version,
      });
    }
  }

  const question = chalk.bold(`\nAre you sure you want to create these versions and Git tags? [y/n] `);
  const updateRecommendedPromise = rl.question(question);

  log(`\n(Re-run with the -i flag to manually edit)`, opts);

  const updateRecommended = await updateRecommendedPromise;
  rl.close();

  if (updateRecommended === 'y') {

    const template = ({ name, version }) => {
      return ` - ${name} ${chalk.bold(version)}`;
    }

    const pad = Math.max(...willUpdate.map(({ name, version }) => {
      return template({ name, version }).length;
    }));

    log('', opts); // Empty line

    for (let { name, version } of willUpdate) {
      let msg = template({ name, version });
      msg = msg.padEnd(pad + 1);

      const flags = `--allow-same-version --no-workspaces-update`;
      await cmd(`npm version ${version} -w ${name} ${flags}`, opts);

      const allPackagesJson = await cmd(`npm pkg get -ws`, opts);
      const allPackagesMap = JSON.parse(allPackagesJson);

      let dependants = [];
      let devDependants = [];

      for (let pkgName in allPackagesMap) {
        let pkg = allPackagesMap[pkgName];
        let dependencies = pkg.dependencies || {};
        let devDependencies = pkg.devDependencies || {};

        if (dependencies[name]) {
          dependants.push(pkgName);
          // Get the version without range prefixes
          const oldVersion = semver.coerce(dependencies[name]);
          const newVersion = dependencies[name].replace(oldVersion, version);
          await cmd(`npm pkg set dependencies.${name}=${newVersion} -w ${pkgName}`, opts);
        }

        if (devDependencies[name]) {
          devDependants.push(pkgName);
          // Get the version without range prefixes
          const oldVersion = semver.coerce(devDependencies[name]);
          const newVersion = devDependencies[name].replace(oldVersion, version);
          await cmd(`npm pkg set devDependencies.${name}=${newVersion} -w ${pkgName}`, opts);
        }
      }

      if (dependants.length || devDependants.length) {
        msg += ` updated in: `;

        devDependants = devDependants.map((dep) => `${dep} (dev)`);
        msg += [...dependants, ...devDependants].join(', ');

        log(msg, opts);
      }

    }
  }


}

async function getRecommendedBump(bump, pkg, path) {
  if (bump === 'conventional') {
    bump = (
      await conventionalRecommendedBump({
        whatBump,
        path,
        lernaPackage: pkg.name,
        tagPrefix: `${pkg.name}@`,
      })
    ).releaseType;
  }

  const version = semver.inc(pkg.version, bump);
  return semver.valid(version);
}

/**
 * Logs a message to the console if the log level is set to 'info' or 'verbose'.
 * @param {any} msg - The message to log.
 * @param {{ 'log-level': string }} opts - The options object.
 */
function log(msg, opts) {
  if (['info', 'verbose'].includes(opts['log-level'])) {
    console.log(msg);
  }
}

// Adapted from https://github.com/conventional-changelog/conventional-changelog/blob/3f60b4641f90e707453c2f37a34b2726ce6c1d43/packages/conventional-changelog-angular/src/whatBump.js
// Added support for no bump if there are no changes
// https://github.com/conventional-changelog/conventional-changelog/issues/399
function whatBump(commits) {
  let level = -1;
  let breakings = 0;
  let features = 0;

  commits.forEach((commit) => {
    if (commit.notes.length > 0) {
      breakings += commit.notes.length;
      level = 0;
    } else if (commit.type === 'feat') {
      features += 1;
      if (level === -1) {
        level = 1;
      }
    }
  });

  return {
    level,
    reason:
      breakings === 1
        ? `There is ${breakings} BREAKING CHANGE and ${features} features`
        : `There are ${breakings} BREAKING CHANGES and ${features} features`,
  };
}

// From npm-check-updates - Tomas Junnonen - Apache-2.0
// https://github.com/raineorshine/npm-check-updates/blob/99b1bbd66ab3f56262ba348b42481f19ea25c2e3/src/lib/version-util.ts#L235-L235

/**
 * Colorize the parts of a version string (to) that are different than
 * another (from). Assumes that the two version strings are in the same format.
 *
 * @param from
 * @param to
 * @returns
 */
export function colorizeDiff(from, to) {
  let leadingWildcard = ''

  // separate out leading ^ or ~
  if (/^[~^]/.test(to) && to[0] === from[0]) {
    leadingWildcard = to[0]
    to = to.slice(1)
    from = from.slice(1)
  }

  // split into parts
  const partsToColor = to.split('.')
  const partsToCompare = from.split('.')

  let i = partsToColor.findIndex((part, i) => part !== partsToCompare[i])
  i = i >= 0 ? i : partsToColor.length

  // major = red (or any change before 1.0.0)
  // minor = cyan
  // patch = green
  const color = i === 0 || partsToColor[0] === '0' ? 'red' : i === 1 ? 'cyan' : 'green'

  // if we are colorizing only part of the word, add a dot in the middle
  const middot = i > 0 && i < partsToColor.length ? '.' : ''

  return leadingWildcard + partsToColor.slice(0, i).join('.') + middot + chalk[color](partsToColor.slice(i).join('.'))
}
