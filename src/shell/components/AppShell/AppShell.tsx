import { useState, type ReactNode } from 'react';
import type { Me } from '@sena/frontend-platform';

import senaLogo from '../../../assets/sena-logo.png';
import { useNavigation } from '../../navigation/use-navigation';
import type { NotificationDataSource } from '../../../app/data-source/notification-data-source';
import { Icon } from '../Icon';
import { NotificationBell } from '../NotificationBell';
import styles from './AppShell.module.css';

export interface AppShellProps {
  user: Me;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  notificationDataSource?: NotificationDataSource;
  children?: ReactNode;
}

const initialsOf = (fullName: string): string =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

/**
 * E1: barra superior, menu de usuario y navegacion derivada de `me.modules`.
 * Sin logica de dominio: solo composicion y presentacion.
 *
 * No se muestra el nombre del rol. Ninguna HU lo pide y el contrato no lo da:
 * `MeResponse.roles[].name` es un string sin etiqueta, y el nombre legible vive en
 * `GET /roles` (`display_name`), que exige el feature `IDENTITY_ROLE_VIEW`. Se
 * imprime el `name` crudo solo cuando el backend lo envia, para no inventar copy.
 */
export const AppShell = ({
  user,
  currentPath,
  onNavigate,
  onLogout,
  notificationDataSource,
  children,
}: AppShellProps) => {
  const { items } = useNavigation(user, currentPath);
  const [collapsed, setCollapsed] = useState(false);
  // Nombre crudo del contrato, sin traducir ni inventar. Vacio si no hay roles.
  const roleName = user.roles[0]?.name ?? '';

  return (
    <div className={collapsed ? `${styles.appShell} ${styles.collapsed}` : styles.appShell}>
      <a className={styles.skipLink} href="#main-content">
        Saltar al contenido
      </a>

      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.navToggle}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-expanded={!collapsed}
          aria-controls="shell-sidenav"
          onClick={() => setCollapsed((value) => !value)}
        >
          <Icon name="menu" size={22} />
        </button>

        <div className={styles.brand}>
          <img className={styles.brandMark} src={senaLogo} alt="SENA" />
          <span className={styles.brandCopy}>
            <span className={styles.brandName}>SENA — Gestión de Horarios</span>
            <span className={styles.brandSubtitle}>Centro de Formación</span>
          </span>
        </div>

        <div className={styles.topbarEnd}>
          {notificationDataSource !== undefined && (
            <NotificationBell dataSource={notificationDataSource} />
          )}

          <button
            type="button"
            className={styles.userTrigger}
            aria-haspopup="menu"
            aria-expanded="false"
          >
            <span className={styles.userAvatar} aria-hidden="true">
              {initialsOf(user.full_name)}
            </span>
            <span className={styles.userCopy}>
              <span className={styles.userName}>{user.full_name}</span>
              {roleName !== '' && <span className={styles.userRole}>{roleName}</span>}
            </span>
          </button>
        </div>
      </header>

      <div className={styles.shellBody}>
        <nav id="shell-sidenav" className={styles.sidenav} aria-label="Navegación principal">
          {roleName !== '' && <p className={styles.roleLabel}>{roleName}</p>}

          <ul className={styles.sidenavList}>
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={item.active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                  aria-current={item.active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  onClick={() => onNavigate(item.path)}
                >
                  <Icon name={item.icon} size={20} className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.sidenavFooter}>
            <button type="button" className={styles.logoutButton} onClick={onLogout}>
              <Icon name="logOut" size={18} />
              <span className={styles.navLabel}>Cerrar sesión</span>
            </button>
          </div>
        </nav>

        <main id="main-content" className={styles.mainArea}>
          {children}
        </main>
      </div>
    </div>
  );
};
