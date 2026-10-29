import { AUTH_ORIGIN, accountUser, accountStorageKey } from './auth-contract.mjs';
let session = { user: null, csrf: '', configured: false };
let unavailable = false;
export const getAccount = () => session.user;
export const workspaceStorageKey = () => accountStorageKey('finflow-open-v1', session.user);
export async function initAuth() {
  if (location.origin === AUTH_ORIGIN) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch('/auth/index.php?action=session', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) throw new Error();
      const value = await response.json();
      session = { user: accountUser(value.user), csrf: typeof value.csrf === 'string' ? value.csrf : '', configured: value.configured === true };
    } catch { unavailable = true; }
    finally { clearTimeout(timer); }
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'account-dialog';
  dialog.setAttribute('aria-labelledby', 'account-title');
  const heading = document.createElement('h2'); heading.id = 'account-title';
  const email = document.createElement('p');
  const note = document.createElement('p'); note.className = 'account-note';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const action = document.createElement(session.user ? 'button' : 'a'); action.className = 'button primary';
  const close = document.createElement('button'); close.className = 'button secondary'; close.textContent = 'Volver'; close.addEventListener('click', () => dialog.close());
  heading.textContent = session.user ? `Hola, ${session.user.name}.` : 'Tu cuenta, tu espacio.';
  email.textContent = session.user?.email || 'Accede con Google o continúa en modo local.';
  note.textContent = 'Tus datos financieros se guardan en este dispositivo. Cada cuenta tiene un espacio separado. Entrar o salir conserva los datos anteriores; no hay sincronización automática.';
  if (session.user) {
    action.textContent = 'Cerrar sesión';
    action.addEventListener('click', async () => {
      action.disabled = true;
      try {
        const response = await fetch('/auth/index.php?action=logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf }, body: '{}' });
        if (!response.ok) throw new Error();
        location.reload();
      } catch { status.textContent = 'No pudimos cerrar la sesión. Reintenta con conexión.'; action.disabled = false; }
    });
  } else {
    action.textContent = 'Continuar con Google';
    action.href = `${AUTH_ORIGIN}/auth/index.php?action=login`;
    if (location.origin === AUTH_ORIGIN && !session.configured) {
      action.removeAttribute('href'); action.setAttribute('aria-disabled', 'true');
      status.textContent = unavailable ? 'No pudimos conectar con el acceso. Recarga para reintentar; puedes seguir en modo local.' : 'El acceso con Google está en preparación. Puedes seguir en modo local.';
    }
  }
  dialog.append(heading, email, note, status, action, close); document.body.append(dialog);
  document.querySelectorAll('[data-account]').forEach(button => {
    button.textContent = session.user ? 'Mi cuenta' : 'Iniciar sesión';
    button.addEventListener('click', () => dialog.showModal());
  });
  document.querySelectorAll('.user-avatar').forEach(avatar => {
    avatar.textContent = session.user ? session.user.name.slice(0, 1).toUpperCase() : '·';
    avatar.setAttribute('title', session.user ? session.user.name : 'Modo local');
  });
}
