import { useCallback, useEffect, useState } from 'react';

import type { Notification, NotificationDataSource } from '../../app/data-source/notification-data-source';

export interface UseNotificationsResult {
  notifications: readonly Notification[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * E2 de `HU-SHELL-004`: el shell muestra las notificaciones que conoce, sin panel de
 * historial mientras TD-012 no exista.
 *
 * Se suscribe a la fuente de datos para recibir notificaciones nuevas en cuanto lleguen,
 * sea cual sea el transporte (polling, WebSocket/SSE o el `EventBus` de HU-SHELL-007).
 * Resolverlas usa `getById`, que es lo único que el backend expone hoy.
 */
export const useNotifications = (dataSource: NotificationDataSource): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<readonly Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const ids = dataSource.knownIds();
        const resolved = await Promise.all(ids.map((id) => dataSource.getById(id)));
        setNotifications(resolved);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'unknown');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [dataSource]);

  useEffect(reload, [reload]);

  // Recibe notificaciones nuevas sin importar de dónde vengan.
  useEffect(
    () =>
      dataSource.subscribe((updated) => {
        setNotifications([...updated].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setLoading(false);
      }),
    [dataSource],
  );

  return { notifications, loading, error, reload };
};