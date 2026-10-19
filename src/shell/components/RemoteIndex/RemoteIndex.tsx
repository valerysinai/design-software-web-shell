import { Icon, type IconName } from '../Icon';
import styles from './RemoteIndex.module.css';

export interface RemoteIndexEntry {
  domain: string;
  federationName: string;
  basePath: string;
}

export interface RemoteIndexProps {
  remotes: readonly RemoteIndexEntry[];
  registryKind: 'mock' | 'federation';
  manifestSource?: string;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

const ICON_BY_DOMAIN: Record<string, IconName> = {
  iam: 'users',
  scheduling: 'calendar',
  'academic-management': 'folder',
  'training-environment': 'home',
  'reference-data': 'file',
  actors: 'users',
  monitoring: 'chart',
  document: 'file',
  audit: 'activity',
};

/**
 * Portada del shell. Lista los 9 dominios que el shell monta y permite entrar a cada uno.
 * Es la vista de la ruta `/`, que de otro modo quedaria sin contenido.
 */
export const RemoteIndex = ({
  remotes,
  registryKind,
  manifestSource,
  currentPath,
  onNavigate,
}: RemoteIndexProps) => (
  <section className={styles.frame}>
    <header className={styles.header}>
      <span className={styles.badge}>
        Registro: {registryKind}
        {manifestSource === undefined ? '' : ` · ${manifestSource}`}
      </span>
      <h1 className={styles.title}>Remotes del shell</h1>
      <p className={styles.subtitle}>
        El shell monta {remotes.length} dominios. Cada uno vive bajo su propia ruta comodin.
      </p>
    </header>

    <div className={styles.grid}>
      {remotes.map((remote) => {
        const isActive = currentPath?.startsWith(remote.basePath) ?? false;
        return (
          <button
            key={remote.domain}
            type="button"
            className={isActive ? `${styles.card} ${styles.cardActive}` : styles.card}
            onClick={() => onNavigate?.(`${remote.basePath}/`)}
          >
            <span className={styles.iconBox}>
              <Icon name={ICON_BY_DOMAIN[remote.domain] ?? 'file'} size={22} />
            </span>
            <span className={styles.cardTitle}>{remote.federationName}</span>
            <span className={styles.cardMeta}>{remote.basePath}/*</span>
          </button>
        );
      })}
    </div>

    {registryKind === 'mock' && (
      <p className={styles.notice}>
        <Icon name="warning" size={16} className={styles.noticeIcon} />
        <span>
          Registros simulados: cada dominio muestra un stub porque los remotes aun no estan
          construidos ni desplegados. Cambia a <code>VITE_REMOTE_SOURCE=federation</code> cuando existan.
        </span>
      </p>
    )}
  </section>
);