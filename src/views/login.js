import { appState } from '../state/appState.js';
import { router } from '../router.js';
import { escapeHtml } from '../utils/format.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEXT_ROUTES = ['favoritos', 'catalogo', 'tiendas', 'contacto'];

const Profile = (user) => `<main id="main-content"><section class="section"><div class="container">
  <div class="auth-card auth-card--center">
    <span class="auth-logo">${escapeHtml(user.name.charAt(0).toUpperCase())}</span>
    <p class="eyebrow">Sesión simulada activa</p>
    <h1>Hola, ${escapeHtml(user.name)}</h1>
    <p>Tu sesión se guarda solo en este navegador mediante localStorage.</p>
    <div class="auth-actions">
      <a class="button" href="#/favoritos">Ver favoritos</a>
      <button class="button button--secondary" type="button" id="logout-button">Cerrar sesión</button>
    </div>
  </div>
</div></section></main>`;

const LoginForm = () => `<main id="main-content"><section class="section"><div class="container">
  <form class="auth-card" id="login-form" novalidate>
    <span class="auth-logo">P</span>
    <p class="eyebrow">Área personal</p>
    <h1>Qué bueno verte</h1>
    <p>Accede para consultar tus favoritos. No necesitas una cuenta real.</p>
    <div class="field"><label for="login-name">Nombre</label><input id="login-name" name="name" autocomplete="name" required placeholder="Tu nombre" aria-describedby="login-name-error"><span class="field-error" id="login-name-error" role="alert"></span></div>
    <div class="field"><label for="login-email">Email</label><input id="login-email" name="email" type="email" autocomplete="email" required placeholder="nombre@ejemplo.com" aria-describedby="login-email-error"><span class="field-error" id="login-email-error" role="alert"></span></div>
    <button class="button button--wide" type="submit">Entrar de forma simulada</button>
    <p class="form-note">Acceso únicamente académico: no hay servidor y no se almacena ninguna contraseña.</p>
  </form>
</div></section></main>`;

export const loginView = () => {
  const { user } = appState.get();
  return user ? Profile(user) : LoginForm();
};

const setError = (input, message) => {
  input.setAttribute('aria-invalid', String(Boolean(message)));
  document.querySelector(`#${input.id}-error`).textContent = message;
};

export const bindLogin = () => {
  document.querySelector('#login-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    setError(nameInput, name.length < 2 ? 'Escribe al menos 2 caracteres.' : '');
    setError(emailInput, EMAIL_PATTERN.test(email) ? '' : 'Introduce un email válido.');
    if (name.length < 2 || !EMAIL_PATTERN.test(email)) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    const next = router.current().query.get('next');
    appState.login({ name, email });
    router.navigate(`/${NEXT_ROUTES.includes(next) ? next : 'favoritos'}`);
  });
  document.querySelector('#logout-button')?.addEventListener('click', () => {
    appState.logout();
    router.navigate('/');
  });
};
