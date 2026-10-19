import type { Notification, NotificationDataSource } from './notification-data-source';

export class NotificationNotFoundError extends Error {
  constructor(id: string) {
    super(`Notificacion no encontrada: ${id}`);
    this.name = 'NotificationNotFoundError';
  }
}

const toNotification = (raw: unknown): Notification => {
  const record = raw as Record<string, unknown>;
  const status = record['send_status'];

  if (status !== 'PENDING' && status !== 'SENT' && status !== 'FAILED') {
    throw new Error(`send_status inesperado: ${String(status)}`);
  }

  const failureReason = record['failure_reason'];
  const sentAt = record['sent_at'];

  return {
    id: String(record['id']),
    recipientId: String(record['recipient_id']),
    subject: String(record['subject'] ?? ''),
    summary: String(record['body_summary'] ?? ''),
    status,
    channel: record['channel'] === 'EMAIL' ? 'EMAIL' : 'IN_APP',
    ...(typeof failureReason === 'string' && failureReason !== ''
      ? { failureReason }
      : {}),
    createdAt: String(record['created_at'] ?? ''),
    ...(typeof sentAt === 'string' ? { sentAt } : {}),
  };
};

/**
 * Fuente real. Usa `GET /notifications/{id}` de `notification-service`.
 *
 * ⚠️ El contrato (`shared-contracts/openapi/notification.yaml`) define `SentNotification`
 * sin `body_summary`, `failure_reason` ni `created_at`, aunque el backend Go si los
 * persiste. Aqui se leen de todos modos y `toNotification` los tolera si faltan.
 *
 * ⚠️ No hay listado por destinatario (TD-012), asi que `knownIds()` devuelve vacio:
 * el shell no puede descubrir notificaciones por su cuenta.
 */
export class HttpNotificationDataSource implements NotificationDataSource {
  readonly kind = 'http' as const;

  private readonly items = new Map<string, Notification>();
  private readonly listeners = new Set<(notifications: readonly Notification[]) => void>();

  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async getById(id: string): Promise<Notification> {
    const response = await this.fetchImpl(`${this.baseUrl}/notifications/${id}`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    if (response.status === 404) throw new NotificationNotFoundError(id);
    if (!response.ok) {
      throw new Error(`No se pudo leer la notificacion ${id} (HTTP ${response.status})`);
    }

    const notification = toNotification(await response.json());
    this.items.set(notification.id, notification);
    return notification;
  }

  knownIds(): string[] {
    return [...this.items.keys()];
  }

  subscribe(listener: (notifications: readonly Notification[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Punto de entrada para notificaciones reales (TD-012 y/o HU-SHELL-007).
   *
   * Por ahora no hay transporte: `notification-service` no expone listado ni stream, y
   * el `EventBus` todavia no existe. Cuando lo haya, quien lo reciba llama a `ingest()`
   * y la campana se actualiza sin tocar componentes.
   */
  ingest(notification: Notification): void {
    this.items.set(notification.id, notification);
    const snapshot = [...this.items.values()];
    for (const listener of this.listeners) listener(snapshot);
  }
}