/**
 * Tipos JSX de los Web Components del design-system — HU-SHELL-006.
 *
 * React 19 no permite declarar intrinsic elements dentro de un `declare global`
 * en un `.ts` normal: hace falta el namespace `React.JSX`, que es el que React
 * lee al resolver los tags.
 *
 * `React.DetailedHTMLProps<React.HTMLAttributes<T>, T>` aporta los atributos
 * estandar (id, className, aria-*, data-*...) y los props especificos que
 * declare cada componente Web Component.
 */
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import type {
  LoadingRemote,
  RemoteUnavailable,
  SenaButton,
  SenaField,
  StatusBadge,
} from '@sena/design-system/components';

type Base<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'sena-loading-remote': Base<LoadingRemote> & {
          domain?: string;
          label?: string;
        };
        'sena-remote-unavailable': Base<RemoteUnavailable> & {
          domain?: string;
          reason?: string;
          'retry-label'?: string;
          onSenaRetry?: (event: CustomEvent<{ domain: string; reason?: string }>) => void;
        };
        'sena-status-badge': Base<StatusBadge> & {
          tone?: string;
          label?: string;
          icon?: string;
        };
        'sena-button': Base<SenaButton> & {
          variant?: string;
          type?: 'button' | 'submit' | 'reset';
          disabled?: boolean;
        };
        'sena-field': Base<SenaField> & {
          label?: string;
          help?: string;
          error?: string;
          required?: boolean;
          id?: string;
        };
      }
    }
  }
}

export {};