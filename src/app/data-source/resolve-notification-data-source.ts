import { HttpNotificationDataSource } from './http-notification-data-source';
import { MockNotificationDataSource } from './mock-notification-data-source';
import {
  NOTIFICATION_SOURCE_ENV,
  type NotificationDataSource,
  type NotificationSource,
} from './notification-data-source';

const isNotificationSource = (value: string | undefined): value is NotificationSource =>
  value === 'mock' || value === 'http';

export interface ResolveNotificationDataSourceInput {
  env: Record<string, unknown>;
  /** Base URL de `notification-service`, solo usada en modo http. */
  baseUrl: string;
}

/**
 * Selector de la fuente de notificaciones.
 *
 * Con `VITE_NOTIFICATION_SOURCE=mock` (por defecto) usa fixtures quemados. Con `=http`
 * usa `GET /notifications/{id}` real. Ningun componente cambia entre un modo y otro.
 *
 * ⚠️ El modo http esta limitado por TD-012: sin el endpoint de listado, el shell solo
 * puede abrir notificaciones cuyo id ya conoce.
 */
export const resolveNotificationDataSource = ({
  env,
  baseUrl,
}: ResolveNotificationDataSourceInput): NotificationDataSource => {
  const raw: unknown = env[NOTIFICATION_SOURCE_ENV];
  const source = typeof raw === 'string' && isNotificationSource(raw) ? raw : 'mock';

  return source === 'http'
    ? new HttpNotificationDataSource(baseUrl)
    : new MockNotificationDataSource();
};