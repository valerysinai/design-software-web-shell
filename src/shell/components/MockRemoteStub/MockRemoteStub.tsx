import type { RemoteDefinition } from '../../remote/remote-registry';
import styles from './MockRemoteStub.module.css';

export interface MockRemoteStubProps {
  definition: RemoteDefinition;
}

/**
 * Stub temporal que representa a un MFE mientras no se construyen sus pantallas.
 * Sirve para ver el chrome del shell (ruta, carga, limites de error) sin datos quemados
 * dentro de los componentes de dominio.
 */
export const MockRemoteStub = ({ definition }: MockRemoteStubProps) => (
  <section className={styles.frame} aria-label={`Remote ${definition.domain}`}>
    <span className={styles.badge}>Remote simulado</span>
    <h2 className={styles.title}>
      <span className={styles.domain}>{definition.federationName}</span>
    </h2>
    <p className={styles.description}>
      Este dominio se montaria aqui desde su <code>remoteEntry.js</code>. El stub existe para validar el
      shell sin tener los remotes construidos ni servidos.
    </p>
    <div className={styles.grid}>
      <div className={styles.cell}>
        <span className={styles.cellLabel}>Dominio</span>
        <span className={styles.cellValue}>{definition.domain}</span>
      </div>
      <div className={styles.cell}>
        <span className={styles.cellLabel}>Ruta base</span>
        <span className={styles.cellValue}>{definition.basePath}/*</span>
      </div>
      <div className={styles.cell}>
        <span className={styles.cellLabel}>Expone</span>
        <span className={styles.cellValue}>./App</span>
      </div>
    </div>
  </section>
);