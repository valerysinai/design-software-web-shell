import { chromium } from '@playwright/test';

/**
 * Verificación de las rutas de navegación en navegador real.
 *
 * ⚠️ Por qué hay dos modos y por qué el de clic es el importante:
 *
 * Una versión anterior solo comprobaba que NO apareciera `RemoteUnavailable`. Eso deja
 * pasar el caso en el que `/fichas` monta el remote equivocado. Pasó de verdad dos veces:
 *
 *   1. Con `node_modules` de react-router 7 corriendo sobre el código de develop.
 *   2. Con react-router 7 ya declarado en el `package.json`.
 *
 * En ambos la URL cambiaba pero el contenido y el item activo se quedaban atrás, y el
 * test daba verde. Ahora se comprueba **qué remote monta** y, sobre todo, **navegando con
 * clic**, que es donde fallaba. Una carga directa de URL sí funcionaba.
 *
 * La navegación por clic se limita a los items que la persona actual puede ver: el menú
 * se deriva de `me.modules` (HU-001 E2), así que pulsar un item inexistente no hace nada
 * y sería un falso fallo.
 */
const BASE = process.env.SHELL_URL ?? 'http://localhost:5000';

/** Módulos que concede la sesión mock de desarrollo. Definen qué items existen en el menú. */
const MODULOS_MOCK = ['MOD_DASHBOARD', 'MOD_SCHEDULING', 'MOD_ACADEMIC', 'MOD_ENVIRONMENT'];

/** Rutas y el remote que debe montar cada una. `activo: null` = sin item en el menú. */
const RUTAS = [
  { ruta: '/', remoto: null, activo: 'Inicio' },
  { ruta: '/scheduling/horarios', remoto: 'scheduling', activo: 'Horarios' },
  { ruta: '/academic-management/fichas', remoto: 'academicManagement', activo: 'Fichas' },
  { ruta: '/training-environment/disponibilidad', remoto: 'trainingEnvironment', activo: 'Disponibilidad' },
  { ruta: '/scheduling/mi-horario', remoto: 'scheduling', activo: 'Mi horario (instructor)' },
  { ruta: '/scheduling/mi-horario-aprendiz', remoto: 'scheduling', activo: 'Mi horario' },
  // Rutas de dominios que existen pero que esta persona no tiene en el menú.
  { ruta: '/actors/mi-disponibilidad', remoto: 'actors', activo: null },
  { ruta: '/monitoring/indicadores', remoto: 'monitoring', activo: null },
  { ruta: '/iam/usuarios', remoto: 'iam', activo: null },
  { ruta: '/reference-data/parametrizacion', remoto: 'referenceData', activo: null },
  { ruta: '/document/documentos', remoto: 'document', activo: null },
  { ruta: '/audit/auditoria', remoto: 'audit', activo: null },
];

/** Solo las rutas cuyo item de menú es alcanzable con los módulos del mock. */
const NAVEGABLES = RUTAS.filter((r) => r.activo !== null && r.activo !== 'Inicio');

const browser = await chromium.launch();
const page = await browser.newPage();

const checks = [];
const check = (nombre, ok, detalle = '') => {
  checks.push({ nombre, ok });
  console.log(`${ok ? '  OK  ' : ' FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
};

/**
 * Lee del DOM qué remote está montado y qué item del menú quedó activo. El stub
 * renderiza `<federationName>` en el título, así que de ahí se lee el dominio.
 */
const sondear = () =>
  page.evaluate(() => {
    const main = document.querySelector('#main-content');
    const texto = main === null ? '' : main.innerText.replace(/\s+/g, ' ');
    const match = texto.match(
      /(iam|actors|audit|document|monitoring|referenceData|scheduling|trainingEnvironment|academicManagement)Mfe/,
    );
    const activo = Array.from(document.querySelectorAll('#shell-sidenav button'))
      .filter((b) => b.getAttribute('aria-current') === 'page')
      .map((b) => b.innerText.trim());
    return {
      url: window.location.pathname,
      remoto: match === null ? null : match[1],
      activo: activo[0] ?? null,
      alert: document.querySelector('sena-remote-unavailable') !== null,
    };
  });

// ---------------------------------------------------------------- carga directa
console.log(`\n== carga directa de URL ==\n`);

for (const { ruta, remoto, activo } of RUTAS) {
  await page.goto(`${BASE}${ruta}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const s = await sondear();

  const problemas = [];
  if (ruta !== '/' && s.remoto !== remoto) problemas.push(`monta ${s.remoto} en vez de ${remoto}`);
  if (activo !== null && s.activo !== activo) problemas.push(`menu activo "${s.activo}" en vez de "${activo}"`);
  check(`${ruta.padEnd(40)} -> ${remoto ?? '(portada)'}`, problemas.length === 0, problemas.join('; '));
}

// ------------------------------------------------- navegación cliente (el bug real)
console.log(`\n== navegacion cliente (clic en el menu) ==\n`);

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Los items visibles según los módulos del mock.
const itemsVisibles = await page.evaluate(() =>
  Array.from(document.querySelectorAll('#shell-sidenav button')).map((b) => b.innerText.trim()),
);
const esperados = NAVEGABLES.map((r) => r.activo);
const ausentes = esperados.filter((e) => !itemsVisibles.includes(e));
check(
  'el menú contiene los items de los módulos concedidos',
  ausentes.length === 0,
  ausentes.length === 0 ? itemsVisibles.join(' | ') : `faltan: ${ausentes.join(', ')}`,
);

for (const { ruta, remoto, activo } of NAVEGABLES) {
  // Clic por coincidencia EXACTA del texto. Con `:has-text()` de Playwright,
  // "Mi horario" también matchea "Mi horario (instructor)".
  await page.evaluate((etiqueta) => {
    const btn = Array.from(document.querySelectorAll('#shell-sidenav button')).find(
      (b) => b.innerText.trim() === etiqueta,
    );
    btn?.click();
  }, activo);
  await page.waitForTimeout(800);

  const s = await sondear();
  const problemas = [];
  if (s.url !== ruta) problemas.push(`url=${s.url} en vez de ${ruta}`);
  if (s.remoto !== remoto) problemas.push(`remoto=${s.remoto} en vez de ${remoto}`);
  if (s.activo !== activo) problemas.push(`activo=${s.activo} en vez de ${activo}`);
  check(`clic "${activo}" -> ${remoto}`, problemas.length === 0, problemas.join('; '));
}

// ------------------------------------------------------------------- resto
await page.goto(`${BASE}/ruta-inexistente`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
check('el catch-all sigue dando RemoteUnavailable', (await sondear()).alert === true);

const items = await page.evaluate(() =>
  Array.from(document.querySelectorAll('#shell-sidenav button')).map((b) => b.innerText.trim()).filter(Boolean),
);
check('el menú no repite labels', new Set(items).size === items.length, items.join(' | '));

// Los módulos del mock son los que acotan el menú; si cambia la lista, esta comprobación avisa.
check(
  `el menú refleja los módulos del mock (${MODULOS_MOCK.length})`,
  itemsVisibles.length === MODULOS_MOCK.length + 3,
  `visibles: ${itemsVisibles.length}`,
);

await page.screenshot({ path: 'HU-SHELL-rutas-corregidas.png', fullPage: true });
await browser.close();

const fallos = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - fallos.length}/${checks.length} verificaciones OK`);
if (fallos.length > 0) {
  console.error('\nFallaron:');
  for (const f of fallos) console.error(`  - ${f.nombre}${f.detalle ? ` (${f.detalle})` : ''}`);
  process.exit(1);
}