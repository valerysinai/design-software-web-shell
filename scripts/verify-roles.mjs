/**
 * Verificacion de que el shell no inventa roles ni datos quemados.
 *
 * Comprueba en navegador real que, sin un catalogo de roles en el codigo, la UI
 * no muestra ninguna etiqueta de rol inventada y el menu se deriva solo de
 * `me.modules`.
 */
import { chromium } from '@playwright/test';

const BASE = process.env.SHELL_URL ?? 'http://localhost:5002';

const browser = await chromium.launch();
const page = await browser.newPage();

const checks = [];
const check = (nombre, ok, detalle = '') => {
  checks.push({ nombre, ok });
  console.log(`${ok ? '  OK  ' : ' FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
};

console.log(`\n== ${BASE}/\n`);

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// 1. Ningun copy de rol del mockup puede aparecer.
const cuerpo = await page.evaluate(() => document.body.innerText);
for (const prohibido of ['Coordinador Académico', 'Coordinador Acad', 'María García', 'Director de Centro']) {
  check(`no aparece "${prohibido}"`, !cuerpo.includes(prohibido));
}

// 2. Tampoco el codigo crudo de un rol, porque el mock ya no trae roles.
check('no aparece ningun codigo de rol', !/COORDINATOR|INSTRUCTOR|LEARNER|ADMIN_STAFF|CENTER_DIRECTOR/.test(cuerpo));

// 3. El shell si se muestra (el mock generico permite verlo).
check('el shell se renderiza', cuerpo.includes('SENA'), cuerpo.split('\n')[0]?.slice(0, 60));
check('muestra el nombre generico', cuerpo.includes('Usuario de desarrollo'));

// 4. El menu viene de me.modules, no de una tabla de roles.
const items = await page.evaluate(() =>
  Array.from(document.querySelectorAll('#shell-sidenav button'))
    .map((b) => b.innerText.trim())
    .filter((t) => t !== 'Cerrar sesión'),
);
check('el menu tiene items', items.length > 0, `${items.length}: ${items.join(', ')}`);

// El mock concede MOD_DASHBOARD, MOD_SCHEDULING, MOD_ACADEMIC, MOD_ENVIRONMENT.
check('incluye Inicio (MOD_DASHBOARD)', items.includes('Inicio'), items.join(', '));
check('incluye Horarios (MOD_SCHEDULING)', items.includes('Horarios'));
// Y NO incluye modulos no concedidos.
check('no incluye Auditoria (sin MOD_AUDIT)', !items.some((t) => t.includes('Auditoría')));

// 5. Sin `ROLE_LABELS` en el bundle: el catalogo no viaja a produccion.
const bundle = await page.evaluate(async () => {
  const scripts = Array.from(document.querySelectorAll('script[src]')).map((s) => s.src);
  const fuentes = await Promise.all(
    scripts.map(async (src) => (await fetch(src)).text()),
  );
  return fuentes.join('\n');
});
check('el bundle no contiene ROLE_LABELS', !bundle.includes('ROLE_LABELS'));
check('el bundle no contiene los labels del mockup', !bundle.includes('Coordinador Académico'));
check('el bundle no contiene MARIA_GARCIA', !bundle.includes('maria.garcia@sena.edu.co'));

await page.screenshot({ path: 'HU-SHELL-roles-sin-datos-quemados.png', fullPage: true });
console.log('\nCaptura: HU-SHELL-roles-sin-datos-quemados.png');

await browser.close();

const fallos = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - fallos.length}/${checks.length} verificaciones OK`);
if (fallos.length > 0) process.exit(1);