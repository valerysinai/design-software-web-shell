import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const shellSource = resolve(here, '..');
const entrypoint = resolve(here, 'tokens.css');
const canonicalSource = resolve(
  here,
  '../../../design-software-design-system/spec/tokens.css',
);

const read = (path: string): string => readFileSync(path, 'utf8');

const cssFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return extname(entry.name) === '.css' ? [path] : [];
  });

const declaredTokens = (css: string): string[] =>
  [...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((match) => match[1] ?? '');

const consumedTokens = (css: string): string[] =>
  [...css.matchAll(/var\((--[a-z0-9-]+)/gim)].map((match) => match[1] ?? '');

describe('HU-SHELL-005: consumo exclusivo de design tokens', () => {
  const canonical = new Set(declaredTokens(read(canonicalSource)));
  const styles = cssFiles(shellSource);

  it('importa el punto de entrada canónico del design-system', () => {
    expect(read(entrypoint)).toContain("@import '@sena/design-system/tokens.css'");
  });

  it('no declara ni reescribe tokens dentro del shell', () => {
    const declarations = styles.flatMap((file) =>
      declaredTokens(read(file)).map((token) => `${file}: ${token}`),
    );

    expect(declarations).toEqual([]);
  });

  it('solo consume tokens declarados por la fuente canónica', () => {
    const unknown = styles.flatMap((file) =>
      consumedTokens(read(file))
        .filter((token) => !canonical.has(token))
        .map((token) => `${file}: ${token}`),
    );

    expect(unknown).toEqual([]);
  });
});
