import { Icon } from '../Icon';
import styles from './OfflineBanner.module.css';

/**
 * E4: cuando el navegador pierde conectividad, el shell lo avisa una sola vez en lugar
 * de dejar que cada MFE muestre su propio error de red.
 *
 * El texto replica el mockup v2 (`shell/shell.js`, clase `offline-banner`):
 * "Sin conexion - mostrando datos guardados".
 */
export const OfflineBanner = () => (
  <div className={styles.banner} role="status">
    <Icon name="wifiOff" size={16} className={styles.icon} />
    <span>
      <strong>Sin conexión</strong> — mostrando datos guardados
    </span>
  </div>
);