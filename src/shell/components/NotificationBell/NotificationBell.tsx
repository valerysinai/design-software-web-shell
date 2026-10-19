import { useState } from 'react';

import type { NotificationDataSource } from '../../../app/data-source/notification-data-source';
import { useNotifications } from '../../hooks/use-notifications';
import { Icon } from '../Icon';
import { NotificationPanel } from './NotificationPanel';
import styles from './NotificationBell.module.css';

export interface NotificationBellProps {
  dataSource: NotificationDataSource;
}

/**
 * Campana de notificaciones del topbar (chrome global del host, no de ningun MFE).
 *
 * El contador sale de `useNotifications`, que se suscribe a la fuente de datos: cuando
 * llegue una notificacion real por el transporte que se implemente (TD-012 para el
 * listado, HU-SHELL-007 para el bus), el badge sube sin tocar este componente.
 */
export const NotificationBell = ({ dataSource }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const { notifications } = useNotifications(dataSource);
  const pending = notifications.length;

  return (
    <div className={styles.trigger}>
      <button
        type="button"
        className={styles.button}
        aria-label={`Notificaciones, ${pending} pendientes`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="bell" size={20} />
        {pending > 0 && <span className={styles.badge}>{pending}</span>}
      </button>

      {open && <NotificationPanel dataSource={dataSource} onClose={() => setOpen(false)} />}
    </div>
  );
};