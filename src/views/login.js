import { appState } from '../state/appState.js';
import { ApiError, isConnectivityError } from '../services/api.js';
import { router } from '../router.js';
import { escapeHtml } from '../utils/format.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const NEXT_ROUTES = ['favoritos', 'catalogo', 'tiendas', 'contacto'];
const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'long' });

const isRegister = () => router.current().query.get('modo') === 'registro';

const Field = ({ id, name, label, type = 'text', autocomplete, hint = '', placeholder = '' }) => `<div class="field">
  <label for="${id}">${label}</label>
  <input id="${id}" name="${name}" type="${type}" autocomplete="${autocomplete}" placeholder="${placeholder}" required aria-describedby="${id}-error${hint ? ` ${id}-hint` : ''}">
  ${hint ? `<span class="field-hint" id="${id}-hint">${hint}</span>` : ''}
  <span class="field-error" id="${id}-error" role="alert"></span>
</div>`;

const AuthTabs = (register) => `<nav class="auth-tabs" aria-label="Acceso">
  <a href="#/login"${register ? '' : ' aria-current="page"'}>Iniciar sesión</a>
  <a href="#/login?modo=registro"${register ? ' aria-current="page"' : ''}>Crear cuenta</a>
</nav>`;

const AuthForm = () => {
  const register = isRegister();
  return `<main id="main-content"><section class="section"><div class="container">
    <form class="auth-card" id="auth-form" data-preserve novalidate>
      <span class="auth-logo">P</span>
      <p class="eyebrow">Área personal</p>
      <h1>${register ? 'Crea tu cuenta' : 'Qué bueno verte'}</h1>
      ${AuthTabs(register)}
      <p>${register ? 'Guarda tus favoritos y tu carrito en tu cuenta y recupéralos en cualquier dispositivo.' : 'Accede para consultar tus favoritos y tu carrito.'}</p>
      ${register ? Field({ id: 'auth-name', name: 'name', label: 'Nombre', autocomplete: 'name', placeholder: 'Tu nombre' }) : ''}
      ${Field({ id: 'auth-email', name: 'email', label: 'Email', type: 'email', autocomplete: 'email', placeholder: 'nombre@ejemplo.com' })}
      ${Field({ id: 'auth-password', name: 'password', label: 'Contraseña', type: 'password', autocomplete: register ? 'new-password' : 'current-password', hint: register ? `Mínimo ${MIN_PASSWORD} caracteres.` : '' })}
      <p class="form-alert" id="auth-alert" role="alert" hidden></p>
      <button class="button button--wide" type="submit">${register ? 'Crear cuenta' : 'Entrar'}</button>
      <p class="form-note">Tu contraseña se envía cifrada al servidor y se guarda con hash. La sesión se mantiene con una cookie segura que el navegador gestiona por ti.</p>
    </form>
  </div></section></main>`;
};

const Profile = (user) => `<main id="main-content"><section class="section"><div class="container">
  <div class="auth-card auth-card--center">
    <span class="auth-logo">${escapeHtml(user.name.charAt(0).toUpperCase())}</span>
    <p class="eyebrow">Sesión iniciada</p>
    <h1>Hola, ${escapeHtml(user.name)}</h1>
    <p>${escapeHtml(user.email)}${user.createdAt ? ` · Miembro desde ${DATE_FORMAT.format(new Date(user.createdAt))}` : ''}</p>
    <p class="form-note">Tus favoritos y tu carrito se guardan en tu cuenta.</p>
    <p class="form-alert" id="auth-alert" role="alert" hidden></p>
    <div class="auth-actions">
      <a class="button" href="#/favoritos">Ver favoritos</a>
      <button class="button button--secondary" type="button" id="logout-button">Cerrar sesión</button>
    </div>
  </div>
</div></section></main>`;

const Loading = () => `<main id="main-content"><section class="section"><div class="container">
  <div class="auth-card auth-card--center" role="status"><span class="spinner" aria-hidden="true"></span><p>Comprobando tu sesión…</p></div>
</div></section></main>`;

export const loginView = () => {
  const { user, auth } = appState.get();
  if (user) return Profile(user);
  if (auth === 'loading') return Loading();
  return AuthForm();
};

const showAlert = (message) => {
  const alert = document.querySelector('#auth-alert');
  if (!alert) return;
  alert.textContent = message;
  alert.hidden = !message;
};

const setFieldError = (input, message) => {
  input.setAttribute('aria-invalid', String(Boolean(message)));
  document.querySelector(`#${input.id}-error`).textContent = message;
};

const setBusy = (button, busy, idleLabel, busyLabel) => {
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
  button.textContent = busy ? busyLabel : idleLabel;
};

/** Mensaje claro según el tipo de fallo: datos incorrectos, cuenta repetida o servidor caído. */
const describeError = (error) => {
  if (isConnectivityError(error)) return `${error.message} Puedes seguir explorando el catálogo mientras tanto.`;
  if (error.code === 'TOO_MANY_ATTEMPTS' || error.code === 'RATE_LIMITED') return error.message;
  return error.message || 'No se pudo completar la operación. Inténtalo de nuevo.';
};

const validateLocally = (form, register) => {
  const fields = [...form.elements].filter((element) => element.name);
  const values = Object.fromEntries(fields.map((element) => [element.name, element.value.trim()]));
  const errors = {};
  if (register && values.name.length < 2) errors.name = 'Escribe al menos 2 caracteres.';
  if (!EMAIL_PATTERN.test(values.email)) errors.email = 'Introduce un email válido.';
  if (register && form.elements.password.value.length < MIN_PASSWORD) errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  if (!register && !form.elements.password.value) errors.password = 'Escribe tu contraseña.';
  return { values: { ...values, password: form.elements.password.value }, errors };
};

const bindAuthForm = (form) => {
  const register = isRegister();
  const idleLabel = register ? 'Crear cuenta' : 'Entrar';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showAlert('');
    const { values, errors } = validateLocally(form, register);
    [...form.elements].filter((el) => el.name).forEach((el) => setFieldError(el, errors[el.name] ?? ''));
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    setBusy(button, true, idleLabel, register ? 'Creando cuenta…' : 'Entrando…');
    try {
      await (register ? appState.register(values) : appState.login(values));
      const next = router.current().query.get('next');
      router.navigate(`/${NEXT_ROUTES.includes(next) ? next : 'favoritos'}`);
    } catch (error) {
      // La interfaz puede haberse repintado mientras se esperaba: se vuelve a localizar el formulario.
      const current = document.querySelector('#auth-form');
      if (!current) return;
      setBusy(current.querySelector('button[type="submit"]'), false, idleLabel);
      const apiError = error instanceof ApiError ? error : new ApiError({ code: 'REQUEST_FAILED' });
      const fieldErrors = apiError.fieldErrors;
      const known = Object.keys(fieldErrors).filter((name) => current.elements[name]);
      known.forEach((name) => setFieldError(current.elements[name], fieldErrors[name]));
      if (apiError.code === 'EMAIL_TAKEN') setFieldError(current.elements.email, apiError.message);
      if (!known.length && apiError.code !== 'EMAIL_TAKEN') showAlert(describeError(apiError));
      (current.querySelector('[aria-invalid="true"]') ?? current.elements.email).focus();
    }
  });
};

export const bindLogin = () => {
  const form = document.querySelector('#auth-form');
  if (form) bindAuthForm(form);

  document.querySelector('#logout-button')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    setBusy(button, true, 'Cerrar sesión', 'Cerrando…');
    try {
      await appState.logout();
      router.navigate('/');
    } catch (error) {
      const current = document.querySelector('#logout-button');
      if (current) setBusy(current, false, 'Cerrar sesión');
      showAlert(`No se pudo cerrar la sesión. ${describeError(error)}`);
    }
  });
};
