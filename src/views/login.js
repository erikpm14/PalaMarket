import { appState } from '../state/appState.js';

export const loginView = () => {
  const { user } = appState.get();
  if (user) return `<main id="main-content"><section class="auth-page"><div class="auth-card"><span class="auth-avatar">${user.name.slice(0, 1).toUpperCase()}</span><p class="eyebrow">Sesión simulada activa</p><h1>Hola, ${user.name}</h1><p>Tu sesión se guarda solo en este navegador mediante localStorage.</p><div class="auth-actions"><a class="button" href="#/favoritos">Ver favoritos</a><button class="button button--secondary" id="logout-button">Cerrar sesión</button></div></div></section></main>`;
  return `<main id="main-content"><section class="auth-page"><form class="auth-card auth-form" id="login-form"><span class="auth-logo">P</span><p class="eyebrow">Área personal</p><h1>Qué bueno verte</h1><p>Accede para consultar tus favoritos. No necesitas una cuenta real.</p><div class="field"><label for="login-name">Nombre</label><input id="login-name" name="name" autocomplete="name" required placeholder="Tu nombre"><span class="field-error"></span></div><div class="field"><label for="login-email">Email</label><input id="login-email" name="email" type="email" autocomplete="email" required placeholder="nombre@ejemplo.com"><span class="field-error"></span></div><button class="button button--wide" type="submit">Entrar de forma simulada</button><small>Este acceso es únicamente académico. No hay backend y no se almacena ninguna contraseña.</small></form></section></main>`;
};

export const bindLogin = (navigate) => {
  document.querySelector('#login-form')?.addEventListener('submit', (event) => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget));
    const valid = data.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    if (!valid) { event.currentTarget.querySelectorAll('.field-error')[0].textContent = data.name.trim().length < 2 ? 'Escribe al menos 2 caracteres.' : ''; event.currentTarget.querySelectorAll('.field-error')[1].textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? '' : 'Introduce un email válido.'; return; }
    appState.login({ name: data.name.trim(), email: data.email.trim() }); navigate('/favoritos');
  });
  document.querySelector('#logout-button')?.addEventListener('click', () => { appState.logout(); navigate('/'); });
};
