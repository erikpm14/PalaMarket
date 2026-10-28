const MIN_MESSAGE = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const contactView = () => `<main id="main-content"><section class="section"><div class="container contact-grid">
  <div class="contact-copy">
    <p class="eyebrow">Hablemos</p>
    <h1>¿Te ayudamos a elegir?</h1>
    <p>Cuéntanos qué buscas y te orientaremos. Este formulario es una simulación y no envía información.</p>
    <aside class="contact-tip"><strong>Un consejo</strong><span>Indica tu nivel, tu posición habitual y qué sensación buscas para recibir una recomendación más útil.</span></aside>
  </div>
  <form class="contact-form" id="contact-form" novalidate>
    <div class="form-row">
      <div class="field"><label for="contact-name">Nombre</label><input id="contact-name" name="name" autocomplete="name" required aria-describedby="contact-name-error"><span class="field-error" id="contact-name-error" role="alert"></span></div>
      <div class="field"><label for="contact-email">Email</label><input id="contact-email" name="email" type="email" autocomplete="email" required aria-describedby="contact-email-error"><span class="field-error" id="contact-email-error" role="alert"></span></div>
    </div>
    <div class="field"><label for="contact-subject">Asunto</label><select id="contact-subject" name="subject" required aria-describedby="contact-subject-error"><option value="">Selecciona una opción</option><option>Ayuda para elegir pala</option><option>Duda sobre disponibilidad</option><option>Consulta sobre tiendas</option><option>Otro asunto</option></select><span class="field-error" id="contact-subject-error" role="alert"></span></div>
    <div class="field"><label for="contact-message">Mensaje</label><textarea id="contact-message" name="message" rows="6" required placeholder="Cuéntanos un poco más…" aria-describedby="contact-message-error"></textarea><span class="field-error" id="contact-message-error" role="alert"></span></div>
    <button class="button button--wide" type="submit">Enviar consulta simulada</button>
    <p class="form-note">No se almacenará ni se enviará ningún dato.</p>
  </form>
</div></section></main>`;

const validate = (input) => {
  const value = input.value.trim();
  if (!value) return 'Este campo es obligatorio.';
  if (input.type === 'email' && !EMAIL_PATTERN.test(value)) return 'Introduce un email válido.';
  if (input.name === 'message' && value.length < MIN_MESSAGE) return `Escribe al menos ${MIN_MESSAGE} caracteres.`;
  return '';
};

const showError = (input, message) => {
  input.setAttribute('aria-invalid', String(Boolean(message)));
  document.querySelector(`#${input.id}-error`).textContent = message;
};

export const bindContact = (onSuccess) => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const fields = [...form.querySelectorAll('[required]')];
  fields.forEach((input) => input.addEventListener('blur', () => showError(input, validate(input))));
  fields.forEach((input) => input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') showError(input, validate(input));
  }));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    fields.forEach((input) => showError(input, validate(input)));
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    form.reset();
    onSuccess();
  });
};
