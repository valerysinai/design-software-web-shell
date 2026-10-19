import { useState, type FormEvent } from 'react';
import styles from './LoginPage.module.css';

/** Shell entry for real IAM authentication when the IAM remote is not deployed. */
export function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try { await onLogin(email.trim(), password); }
    catch { setError('No fue posible iniciar sesión. Verifica tus credenciales y la conexión con IAM.'); }
    finally { setBusy(false); setPassword(''); }
  }
  return <main className={styles.page}>
    <form className={styles.card} onSubmit={(event) => void submit(event)}>
      <p className={styles.brand}>SENA · Gestión de Horarios</p>
      <h1>Iniciar sesión</h1>
      <p>Ingresa con tu cuenta para acceder a los módulos autorizados.</p>
      <label htmlFor="login-email">Correo electrónico</label>
      <input id="login-email" type="email" autoComplete="username" required value={email}
        onChange={(event) => setEmail(event.target.value)} disabled={busy} />
      <label htmlFor="login-password">Contraseña</label>
      <input id="login-password" type="password" autoComplete="current-password" required value={password}
        onChange={(event) => setPassword(event.target.value)} disabled={busy} />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
    </form>
  </main>;
}
