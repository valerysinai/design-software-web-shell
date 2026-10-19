import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const infra = resolve(process.cwd(), '../docker-infra/design-software-docker-infra');
const envPath = resolve(infra, 'validation/r1-reference/.env');
const fixture = Object.fromEntries(readFileSync(envPath, 'utf8').split(/\r?\n/).filter((line) => line.includes('=')).map((line) => {
  const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)];
}));
if (!fixture['FIXTURE_PASSWORD']) throw new Error('Prepare the real R1 backend first.');
const evidence = resolve(infra, 'validation/frontend-reference/evidence');
mkdirSync(evidence, { recursive: true });
const runId = process.env['FRONTEND_RUN_ID'] || Date.now().toString(36).toUpperCase();
const composeArgs = ['compose', '--env-file', envPath, '-p', 'r1-reference',
  '-f', resolve(infra, 'validation/hu-ref-020/compose.yml'),
  '-f', resolve(infra, 'validation/r1-reference/compose.override.yml')];
process.env['WORKSPACE_ROOT'] = resolve(infra, '../..').replaceAll('\\', '/');
function compose(...args: string[]) {
  return execFileSync('docker', [...composeArgs, ...args], { encoding: 'utf8', timeout: 120_000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}
function sql(query: string) {
  return compose('exec', '-T', 'postgres', 'psql', '-U', 'validation_owner', '-d', 'hu_ref_020', '-At', '-v', 'ON_ERROR_STOP=1', '-c', query);
}
test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(20_000);
  page.on('pageerror', (error) => console.warn('Browser error:', error.message));
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') console.warn('Request failed:', new URL(request.url()).pathname, request.failure()?.errorText);
  });
});
async function login(page: Page, role: 'admin' | 'learner') {
  await page.goto('/reference-data/parametrizacion');
  await page.getByLabel('Correo electrónico').fill(`hu-ref-018-${role}@example.test`);
  await page.getByLabel('Contraseña', { exact: true }).fill(fixture['FIXTURE_PASSWORD']);
  const response = page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/me') && r.status() === 200);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  const me = await (await response).json();
  expect(me.email).toBe(`hu-ref-018-${role}@example.test`);
  await expect(page.locator('[data-mfe="reference-data"]')).toBeVisible();
  await expect(page.getByText(/Modo de demostracion local/)).toHaveCount(0);
  return me;
}
async function openCatalogs(page: Page) {
  await page.getByRole('button', { name: 'Catálogos y parámetros', exact: true }).click();
}
async function createCatalog(page: Page, code: string) {
  await page.getByRole('button', { name: /Nuevo catálogo/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo catálogo', exact: true });
  await dialog.getByLabel('Código', { exact: true }).fill(code);
  await dialog.getByLabel('Nombre', { exact: true }).fill(`Prueba visual ${code}`);
  const response = page.waitForResponse((r) => r.url().endsWith('/catalogs') && r.request().method() === 'POST');
  await dialog.getByRole('button', { name: /Guardar/ }).click();
  const saved = await response;
  expect(saved.status()).toBe(201);
  const body = await saved.json();
  await expect(dialog).toBeHidden();
  await page.getByRole('textbox', { name: 'Buscar catálogo' }).fill(code);
  await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
  return body.id as string;
}

test('HU-REF-020: IAM login, real parameter create/update, persistence and logout', async ({ page }) => {
  const me = await login(page, 'admin');
  expect(me.features.some((f: string) => f.startsWith('REF_PARAMETER_MANAGE'))).toBe(true);
  await openCatalogs(page);
  await page.getByRole('tab', { name: 'Parámetros del sistema', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo parámetro', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo parámetro', exact: true });
  const key = `UI_HU020_${runId}`;
  await dialog.getByLabel('Clave', { exact: true }).fill(key);
  await dialog.getByLabel('Valor', { exact: true }).fill('before');
  const created = page.waitForResponse((r) => r.url().endsWith('/parameters') && r.request().method() === 'POST');
  await dialog.getByRole('button', { name: /Guardar/ }).click();
  const createResponse = await created;
  expect(createResponse.status()).toBe(201);
  const parameter = await createResponse.json();
  await expect(dialog).toBeHidden();
  await page.getByRole('textbox', { name: 'Buscar parámetro' }).fill(key);
  const row = page.getByRole('row').filter({ hasText: key });
  await expect(row).toContainText('before');
  await row.getByRole('button', { name: 'Editar', exact: true }).click();
  const edit = page.getByRole('dialog', { name: 'Editar parámetro', exact: true });
  await edit.getByLabel('Valor', { exact: true }).fill('after');
  const updated = page.waitForResponse((r) => r.url().endsWith(`/parameters/${parameter.id}`) && r.request().method() === 'PUT');
  await edit.getByRole('button', { name: /Guardar/ }).click();
  expect((await updated).status()).toBe(200);
  await expect(row).toContainText('after');
  await page.reload();
  await openCatalogs(page);
  await page.getByRole('tab', { name: 'Parámetros del sistema', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar parámetro' }).fill(key);
  await expect(page.getByRole('row').filter({ hasText: key })).toContainText('after');
  await page.screenshot({ path: resolve(evidence, 'hu-ref-020-parameter.png'), fullPage: true });
  const logout = page.waitForResponse((r) => r.url().endsWith('/auth/logout'));
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  expect((await logout).status()).toBe(204);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('sena.access_token'))).toBeNull();
});

test('HU-REF-020: learner cannot access parameter UI or protected API; missing/invalid JWT rejected', async ({ page }) => {
  const me = await login(page, 'learner');
  expect(me.features.some((f: string) => f.startsWith('REF_PARAMETER_MANAGE'))).toBe(false);
  await openCatalogs(page);
  await expect(page.getByRole('tab', { name: 'Parámetros del sistema', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Nuevo catálogo|Nuevo parámetro/ })).toHaveCount(0);
  const statuses = await page.evaluate(async () => {
    const path = '/reference-api/api/v1/parameters';
    const token = sessionStorage.getItem('sena.access_token')!;
    const learner = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
    const missing = await fetch(path);
    const invalid = await fetch(path, { headers: { Authorization: 'Bearer invalid.jwt.token' } });
    return [learner.status, missing.status, invalid.status];
  });
  expect(statuses).toEqual([403, 401, 401]);
  await page.screenshot({ path: resolve(evidence, 'hu-ref-020-learner.png'), fullPage: true });
});

test('R1: UI business writes survive broker outage/restart and duplicate event delivery', async ({ page }) => {
  await login(page, 'admin');
  await openCatalogs(page);
  const codeA = `UIR1_${runId}_A`;
  const codeB = `UIR1_${runId}_B`;
  const idA = await createCatalog(page, codeA);
  await expect.poll(() => sql(`SELECT applied_events FROM parameterization.event_projection WHERE aggregate_type='catalog' AND aggregate_id='${idA}';`), { timeout: 60_000 }).toBe('1');
  let stopped = false;
  let idB = '';
  try {
    compose('stop', 'rabbitmq'); stopped = true;
    idB = await createCatalog(page, codeB);
    expect(sql(`SELECT count(*) FROM parameterization.catalog WHERE id='${idB}';`)).toBe('1');
    expect(sql(`SELECT count(*) FROM parameterization.outbox_event WHERE aggregate_id='${idB}' AND status <> 'published';`)).toBe('1');
    expect(sql(`SELECT count(*) FROM parameterization.event_projection WHERE aggregate_id='${idB}';`)).toBe('0');
    await page.screenshot({ path: resolve(evidence, 'r1-broker-down-catalog-saved.png'), fullPage: true });
    compose('restart', 'reference');
    await expect.poll(async () => {
      try { return (await page.request.get('http://127.0.0.1:18090/health/ready')).status(); } catch { return 0; }
    }, { timeout: 90_000 }).toBe(200);
    await page.reload(); await openCatalogs(page);
    await page.getByRole('textbox', { name: 'Buscar catálogo' }).fill(codeB);
    await expect(page.getByText(codeB, { exact: true }).first()).toBeVisible();
  } finally {
    if (stopped) compose('up', '-d', '--wait', 'rabbitmq');
  }
  const ids = `'${idA}','${idB}'`;
  await expect.poll(() => sql(`SELECT coalesce(sum(applied_events),0) FROM parameterization.event_projection WHERE aggregate_id IN (${ids});`), { timeout: 90_000 }).toBe('2');
  await expect.poll(() => sql(`SELECT count(*) FROM parameterization.outbox_event WHERE aggregate_id IN (${ids}) AND status='published';`), { timeout: 60_000 }).toBe('2');
  // Deliberately republish the persisted events with their original IDs/bodies.
  sql(`UPDATE parameterization.outbox_event SET status='pending' WHERE aggregate_id IN (${ids});`);
  await expect.poll(() => sql(`SELECT count(*) FROM parameterization.outbox_event WHERE aggregate_id IN (${ids}) AND status='published';`), { timeout: 60_000 }).toBe('2');
  const fence = await createCatalog(page, `UIR1_${runId}_FENCE`);
  await expect.poll(() => sql(`SELECT applied_events FROM parameterization.event_projection WHERE aggregate_id='${fence}';`), { timeout: 60_000 }).toBe('1');
  expect(sql(`SELECT count(*) FROM parameterization.outbox_event o JOIN parameterization.event_inbox i ON i.event_id=o.event_id AND i.consumer_name='reference-data.projection.v1' WHERE o.aggregate_id IN (${ids});`)).toBe('2');
  expect(sql(`SELECT sum(applied_events) FROM parameterization.event_projection WHERE aggregate_id IN (${ids});`)).toBe('2');
  console.warn(`R1 UI: run=${runId}, original_events=2, inbox=2, effects=2, deliberate_duplicates=2, lost=0, duplicate_effects=0; extra fence excluded`);
  await page.getByRole('textbox', { name: 'Buscar catálogo' }).fill(codeB);
  await page.screenshot({ path: resolve(evidence, 'r1-recovered-catalog.png'), fullPage: true });
});
