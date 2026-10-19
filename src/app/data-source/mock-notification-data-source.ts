import { NOTIFICATION_FIXTURES } from './fixtures/notification.fixtures';
import type { Notification, NotificationDataSource } from './notification-data-source';

export class NotificationNotFoundError extends Error {
  constructor(id: string) {
    super(`Notificacion no encontrada: ${id}`);
    this.name = 'NotificationNotFoundError';
  }
}

/**
 * Estado en memoria de las notificaciones conocidas por el shell.
 *
 * Comparte el patrón con `MockSessionDataSource`: guarda los datos y notifica cambios.
 * `ingest()` es el punto de entrada que queda abierto para las notificaciones reales:
 * cuando exista el transporte (TD-012 para listado, HU-SHELL-007 para el bus), se
 * llama a `ingest()` y la campana se actualiza sin tocar la UI.
 *
 * ⚠️ Sustituye a la fuente real mientras TD-012 no exista.
 */
export class MockNotificationDataSource implements NotificationDataSource {
  readonly kind = 'mock' as const;

  private readonly items = new Map<string, Notification>();
  private readonly listeners = new Set<(notifications: readonly Notification[]) => void>();

  /** Simula la latencia de red para que el estado de carga sea visible. */
  constructor(private readonly delayMs: number = 0) {
    for (const notification of NOTIFICATION_FIXTURES) {
      this.items.set(notification.id, structuredClone(notification));
    }
  }

  async getById(id: string): Promise<Notification> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const found = this.items.get(id);
    if (found === undefined) throw new NotificationNotFoundError(id);

    return structuredClone(found);
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

  ingest(notification: Notification): void {
    this.items.set(notification.id, structuredClone(notification));
    const snapshot = [...this.items.values()];
    for (const listener of this.listeners) listener(snapshot);
  }
}