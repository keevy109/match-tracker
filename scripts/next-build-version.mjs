import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const INITIAL_VERSION = '2.5.6';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function parseVersion(value) {
  const match = /^build\/v(\d+)\.(\d+)\.(\d+)$/.exec(value);
  return match ? match.slice(1).map(Number) : null;
}

function latestVersion() {
  const tags = git('tag', '--list', 'build/v*').split('\n').filter(Boolean);
  const versions = tags.map(parseVersion).filter(Boolean);
  if (!versions.length) return INITIAL_VERSION.split('.').map(Number);
  return versions.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]).at(-1);
}

function nextVersion(previous, message) {
  let [major, minor, patch] = previous;
  if (/\[major\]/i.test(message)) return [major + 1, 0, 0];
  if (/\[minor\]/i.test(message)) return [major, minor + 1, 0];

  patch += 1;
  if (patch > 9) {
    patch = 0;
    minor += 1;
  }
  if (minor > 99) return [major + 1, 0, 0];
  return [major, minor, patch];
}

const sha = process.env.GITHUB_SHA || 'HEAD';
const message = git('log', '-1', '--format=%B', sha);
const version = nextVersion(latestVersion(), message).join('.');

if (process.env.GITHUB_OUTPUT) {
  process.stdout.write(`version=${version}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
} else {
  process.stdout.write(`${version}\n`);
}
