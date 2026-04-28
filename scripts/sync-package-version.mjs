import { readFileSync, writeFileSync } from 'node:fs';

const versionSource = readFileSync('src/lib/version.ts', 'utf8');
const match = versionSource.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);

if (!match) {
  throw new Error('Could not find APP_VERSION in src/lib/version.ts');
}

const version = match[1];

for (const file of ['package.json', 'package-lock.json']) {
  const json = JSON.parse(readFileSync(file, 'utf8'));

  json.version = version;

  if (file === 'package-lock.json' && json.packages?.['']) {
    json.packages[''].version = version;
  }

  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

console.log(`Synced package metadata to ${version}`);
