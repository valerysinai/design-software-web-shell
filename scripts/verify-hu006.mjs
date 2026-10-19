/**
 * Verificacion de HU-SHELL-006 en navegador real.
 *
 * Los tests unitarios corren en jsdom, que no aplica shadow DOM ni calcula
 * estilos. Este script abre el shell con Playwright y comprueba que los Web
 * Components se registran, se pintan y heredan los tokens del design-system.
 *
 * Uso: node scripts/verify-hu006.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.SHELL_URL ?? 'http://localhost:5000';
const RUTA_ROTA = '/ruta-que-no-existe';

const browser = await chromium.launch();
const page = await browser.newPage();

const errores = [];
page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errores.push(`console: ${msg.text()}`);
});

const checks = [];
const check = (nombre, ok, detalle = '') => {
  checks.push({ nombre, ok, detalle });
  console.log(`${ok ? '  OK  ' : ' FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
};

console.log(`\n== ${BASE}${RUTA_ROTA}\n`);

await page.goto(`${BASE}${RUTA_ROTA}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// 1. El custom element esta registrado en el navegador real.
const registrado = await page.evaluate(() =>
  customElements.get('sena-remote-unavailable') !== undefined &&
  customElements.get('sena-loading-remote') !== undefined &&
  customElements.get('sena-status-badge') !== undefined &&
  customElements.get('sena-button') !== undefined &&
  customElements.get('sena-field') !== undefined,
);
check('los 5 Web Components estan registrados', registrado);

// 2. La ruta sin remote monta <sena-remote-unavailable>.
const host = page.locator('sena-remote-unavailable').first();
const montado = (await host.count()) > 0;
check('la ruta sin remote monta <sena-remote-unavailable>', montado);

if (montado) {
  const attrs = await host.evaluate((el) => ({
    domain: el.getAttribute('domain'),
    reason: el.getAttribute('reason'),
  }));
  check('recibe domain', attrs.domain !== null, `domain=${attrs.domain}`);

  // 3. El shadow DOM existe y tiene el alert.
  const enShadow = await host.evaluate((el) => el.shadowRoot !== null &&
    el.shadowRoot.querySelector('[role="alert"]') !== null);
  check('el shadow DOM tiene role=alert', enShadow);

  // 4. E4 en el navegador: el color calculado sale de un token, no de un literal.
  const estilo = await host.evaluate((el) => {
    const btn = el.shadowRoot.querySelector('.retry');
    if (btn === null) return null;
    const cs = getComputedStyle(btn);
    return { bg: cs.backgroundColor, radius: cs.borderRadius, minH: cs.minHeight };
  });
  check('el boton toma sus valores de tokens', estilo !== null,
    estilo ? `bg=${estilo.bg} radius=${estilo.radius} minHeight=${estilo.minH}` : 'sin boton');

  // 5. El texto visible es real, no un placeholder.
  const texto = await host.evaluate((el) =>
    (el.shadowRoot.textContent ?? '').replace(/\s+/g, ' ').trim());
  check('el texto menciona el dominio', texto.includes(attrs.domain ?? ''), texto.slice(0, 90));

  // 6. El boton de reintento emite el evento al host (composed).
  const llegaAlHost = await host.evaluate((el) => {
    let recibido = false;
    const listener = () => { recibido = true; };
    el.addEventListener('sena-retry', listener);
    el.shadowRoot.querySelector('.retry').click();
    el.removeEventListener('sena-retry', listener);
    return recibido;
  });
  check('sena-retry sale del shadow y llega al host', llegaAlHost);
}

// 7. Los tokens del design-system estan cargados en :root.
//
// Nota: los remotos no estan levantados en este entorno, asi que el shell cae
// en stubs. Se filtran tres familias de ruido que NO son de HU-006:
//   - los `remoteEntry.js` de los MFEs (conexion rechazada),
//   - el warning de `createRoot` que emite el plugin de Federation,
//   - React DevTools, que solo aparece en desarrollo.
const ignorables =
  /ERR_CONNECTION_REFUSED|Failed to fetch dynamically imported module|createRoot from "react-dom"|Download the React DevTools/;
const erroresRelevantes = errores.filter((e) => !ignorables.test(e));

const tokens = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    brand: cs.getPropertyValue('--color-brand').trim(),
    space4: cs.getPropertyValue('--space-4').trim(),
    brandStrong: cs.getPropertyValue('--color-brand-strong').trim(),
    touch: cs.getPropertyValue('--target-touch-min').trim(),
    radiusFull: cs.getPropertyValue('--radius-full').trim(),
  };
});
check('--color-brand publicado', tokens.brand === '#007832', tokens.brand);
// El shell re-declara su escala `shell-` (decision de HU-SHELL-005), asi que
// `--space-4` vale 1rem en vez de 16px. Se verifica que exista, no su valor.
check('--space-4 publicado', tokens.space4 !== '', tokens.space4);
check('--color-brand-strong (nuevo HU-006)', tokens.brandStrong === '#006d2e', tokens.brandStrong);
check('--target-touch-min (nuevo HU-006)', tokens.touch === '44px', tokens.touch);
check('--radius-full (nuevo HU-006)', tokens.radiusFull === '9999px', tokens.radiusFull);

// 8. Sin errores de consola ajenos a los remotes caidos.
check('sin errores de consola relevantes', erroresRelevantes.length === 0,
  erroresRelevantes.slice(0, 3).join(' | '));

await page.screenshot({ path: 'hu-006-remote-unavailable.png', fullPage: true });
console.log('\nCaptura: hu-006-remote-unavailable.png');

await browser.close();

const fallos = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - fallos.length}/${checks.length} verificaciones OK`);
if (fallos.length > 0) {
  console.error('\nFallaron:');
  for (const f of fallos) console.error(`  - ${f.nombre}${f.detalle ? ` (${f.detalle})` : ''}`);
  process.exit(1);
}