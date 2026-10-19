import { useEffect, useRef } from 'react';

import type { Notification } from '../../../app/data-source/notification-data-source';
import { useNotifications } from '../../hooks/use-notifications';
import { Icon } from '../Icon';
import styles from './NotificationPanel.module.css';

export interface NotificationPanelProps {
  dataSource: Parameters<typeof useNotifications>[0];
  onClose: () => void;
}

const STATUS_LABEL: Record<Notification['status'], string> = {
  SENT: 'Enviada',
  PENDING: 'Pendiente',
  FAILED: 'Fallida',
};

const STATUS_CLASS: Record<Notification['status'], string> = {
  SENT: styles['statusSent'],
  PENDING: styles['statusPending'],
  FAILED: styles['statusFailed'],
};

/** Formatea una fecha ISO a texto corto. Si no se puede parsear, devuelve la cadena. */
const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Panel desplegable de la campana de notificaciones.
 *
 * ⚠️ TD-012: sin `GET /notifications` no hay bandeja real. El panel muestra las
 * notificaciones que el shell conoce y lo declara en un aviso al pie, en vez de simular
 * un historial que no existe. Cuando TD-012 se implemente, la lista crece sin tocar esto.
 */
export const NotificationPanel = ({ dataSource, onClose }: NotificationPanelProps) => {
  const { notifications, loading, error } = useNotifications(dataSource);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    const onPointerDown = (event: PointerEvent): void => {
      if (containerRef.current?.contains(event.target as Node) === false) onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onClose]);

  return (
    <div className={styles.panel} role="dialog" aria-label="Notificaciones" ref={containerRef}>
      <div className={styles.header}>
        <h2 className={styles.title}>Notificaciones</h2>
        <span className={styles.count}>{notifications.length}</span>
      </div>

      {loading && <p className={styles.state}>Cargando notificaciones...</p>}

      {!loading && error !== null && (
        <p className={styles.state} role="alert">
          No pudimos cargar las notificaciones.
        </p>
      )}

      {!loading && error === null && notifications.length === 0 && (
        <div className={styles.empty}>
          <Icon name="bell" size={24} className={styles.emptyIcon} />
          <p>No tienes notificaciones</p>
        </div>
      )}

      {!loading && error === null && notifications.length > 0 && (
        <ul className={styles.list}>
          {notifications.map((item) => (
            <li key={item.id} className={styles.item}>
              <span className={styles.itemSubject}>{item.subject}</span>
              {item.summary !== '' && <span className={styles.itemSummary}>{item.summary}</span>}
              <span className={styles.itemMeta}>
                <span className={`${styles.status} ${STATUS_CLASS[item.status]}`}>
                  {STATUS_LABEL[item.status]}
                </span>
                <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
              </span>
              {item.failureReason !== undefined && (
                <span className={styles.itemSummary}>Motivo: {item.failureReason}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className={styles.notice}>
        <Icon name="warning" size={14} className={styles.noticeIcon} />
        <span>
          Vista limitada por datos quemados: <code>notification-service</code> aun no expone
          el listado de notificaciones (TD-012).
        </span>
      </p>
    </div>
  );
};