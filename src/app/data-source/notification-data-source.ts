/**
 * Contrato de datos de notificaciones que consume el shell.
 *
 * Mismo patrón que `SessionDataSource`: los componentes dependen de esta interfaz,
 * nunca de `fetch` ni de una implementación concreta.
 *
 * ⚠️ TD-012: el endpoint de listado `GET /notifications?recipient_id=&cursor=&limit=`
 * todavía NO existe en `notification-service`. El backend expone solo `POST
 * /notifications` y `GET /notifications/{id}`, y el modelo implementa la primera
 * iteración (E2 de la HU): mostrar la notificación cuyo id ya se conoce, sin panel
 * de historial. Cuando TD-012 se implemente, se añade `list()` a esta interfaz y el
 * panel se enchufa sin tocar componentes.
 */

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export type NotificationChannel = 'EMAIL' | 'IN_APP';

/**
 * Los campos vienen de `SentNotification` en
 * `design-software-notification-service/internal/domain/model`. Los que la UI no usa
 * se omiten; añadir uno aquí obliga a tocar el backend, no solo el shell.
 */
export interface Notification {
  id: string;
  recipientId: string;
  subject: string;
  /** `body_summary`: cuerpo renderizado cuando hubo template. Vacío si no. */
  summary: string;
  status: NotificationStatus;
  channel: NotificationChannel;
  /** `failure_reason`, presente solo si `status` es `FAILED`. */
  failureReason?: string;
  /** ISO 8601. El shell lo formatea a texto legible. */
  createdAt: string;
  sentAt?: string;
}

export interface NotificationDataSource {
  readonly kind: 'mock' | 'http';
  /**
   * Obtiene una notificacion por id. Es lo único que permite hoy el backend.
   * Para una bandeja completa hace falta `list()` (TD-012).
   */
  getById(id: string): Promise<Notification>;
  /** Ids que el shell ya conoce, p. ej. recibidos por un evento en tiempo real. */
  knownIds(): string[];

  /**
   * Recibe notificaciones nuevas desde fuera y las notifica a quien se suscriba.
   *
   * Es el punto de entrada que queda abierto para las notificaciones reales: hoy no
   * hay transporte (TD-012 para el listado, HU-SHELL-007 para el `EventBus`), pero
   * cuando exista — polling, WebSocket/SSE o el bus — solo hay que llamar a `ingest()`
   * y la campana se actualiza. La UI no depende del transporte.
   */
  subscribe(listener: (notifications: readonly Notification[]) => void): () => void;
  /** Inserta o actualiza una notificacion y avisa a los suscriptores. */
  ingest(notification: Notification): void;
}

export const NOTIFICATION_SOURCE_ENV = 'VITE_NOTIFICATION_SOURCE';

export type NotificationSource = 'mock' | 'http';