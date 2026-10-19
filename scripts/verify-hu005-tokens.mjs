import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shellRoot = resolve(here, '..');
const sourceTokens = resolve(
  shellRoot,
  '../design-software-design-system/spec/tokens.css',
);
const entrypoint = resolve(shellRoot, 'src/styles/tokens.css');
const sourceRoot = resolve(shellRoot, 'src');

const fail = (message) => {
  throw new Error(`HU-SHELL-005: ${message}`);
};

const cssFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return extname(entry.name) === '.css' ? [path] : [];
  });

const declaredTokens = (css) =>
  new Set([...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((match) => match[1]));

const consumedTokens = (css) =>
  new Set([...css.matchAll(/var\((--[a-z0-9-]+)/gim)].map((match) => match[1]));

if (!existsSync(sourceTokens)) fail(`no se encuentra la fuente canónica: ${sourceTokens}`);
if (!existsSync(entrypoint)) fail('no se encuentra src/styles/tokens.css');

const canonical = declaredTokens(readFileSync(sourceTokens, 'utf8'));
if (canonical.size === 0) fail('la fuente canónica no publica tokens CSS');

const entrypointCss = readFileSync(entrypoint, 'utf8');
if (!entrypointCss.includes("@import '@sena/design-system/tokens.css'")) {
  fail('el punto de entrada no importa @sena/design-system/tokens.css');
}

const declarations = [];
const unknownUses = [];
for (const file of cssFiles(sourceRoot)) {
  const css = readFileSync(file, 'utf8');
  for (const token of declaredTokens(css)) declarations.push(`${file}: ${token}`);
  for (const token of consumedTokens(css)) {
    if (!canonical.has(token)) unknownUses.push(`${file}: ${token}`);
  }
}

if (declarations.length > 0) {
  fail(`el shell declara tokens propios: ${declarations.join(', ')}`);
}
if (unknownUses.length > 0) {
  fail(`el shell consume tokens fuera del design-system: ${unknownUses.join(', ')}`);
}

console.log(`HU-SHELL-005 token guard passed (${canonical.size} tokens canonicos, sin redefiniciones).`);
