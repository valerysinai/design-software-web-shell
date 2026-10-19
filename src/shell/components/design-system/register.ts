/**
 * Registro de los Web Components del design-system — HU-SHELL-006.
 *
 * Los componentes son Custom Elements (ADR-009 §1). React los trata como nodos
 * desconocidos por defecto, asi que hace falta:
 *
 *   1. Importar este modulo UNA vez, para que se ejecuten los `customElements.define`.
 *   2. Declarar los intrinsic elements en JSX (ver `jsx.d.ts`).
 *
 * Sin el paso 2, `<sena-loading-remote>` compila pero React no refleja los
 * atributos.
 *
 * La API del design-system se reexporta aqui para que el shell tenga un unico
 * punto de entrada.
 */
import '@sena/design-system/components';

export type {
  Tone,
  Variant,
  RemoteUnavailableDetail,
} from '@sena/design-system/components';

export {
  TONES,
  VARIANTS,
  normalizeTone,
  normalizeVariant,
} from '@sena/design-system/components';