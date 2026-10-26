export const contactView = () => `<main id="main-content"><section class="contact-page section"><div class="container contact-grid"><div class="contact-copy"><p class="eyebrow eyebrow--accent">Hablemos</p><h1>¿Te ayudamos a elegir?</h1><p>Cuéntanos qué buscas y te responderemos… en una tienda real. Este formulario es una simulación y no envía información.</p><div class="contact-detail"><strong>Consejo PalaMarket</strong><span>Indica tu nivel, posición habitual y qué sensación buscas para recibir una recomendación más útil.</span></div></div><form class="contact-form" id="contact-form" novalidate><div class="form-row"><div class="field"><label for="contact-name">Nombre</label><input id="contact-name" name="name" autocomplete="name" required><span class="field-error"></span></div><div class="field"><label for="contact-email">Email</label><input id="contact-email" name="email" type="email" autocomplete="email" required><span class="field-error"></span></div></div><div class="field"><label for="contact-subject">Asunto</label><select id="contact-subject" name="subject" required><option value="">Selecciona una opción</option><option>Ayuda para elegir pala</option><option>Duda sobre disponibilidad</option><option>Consulta sobre tiendas</option><option>Otro asunto</option></select><span class="field-error"></span></div><div class="field"><label for="contact-message">Mensaje</label><textarea id="contact-message" name="message" rows="6" minlength="20" required placeholder="Cuéntanos un poco más…"></textarea><span class="field-error"></span></div><button class="button button--wide" type="submit">Enviar consulta simulada</button><p class="form-note">No se almacenará ni enviará ningún dato.</p></form></div></section></main>`;

export const bindContact = (onSuccess) => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault(); let valid = true;
    form.querySelectorAll('[required]').forEach((input) => {
      const error = input.parentElement.querySelector('.field-error');
      let message = '';
      if (!input.value.trim()) message = 'Este campo es obligatorio.';
      else if (input.type === 'email' && !input.validity.valid) message = 'Introduce un email válido.';
      else if (input.name === 'message' && input.value.trim().length < 20) message = 'Escribe al menos 20 caracteres.';
      input.setAttribute('aria-invalid', String(Boolean(message))); error.textContent = message; valid = valid && !message;
    });
    if (valid) { form.reset(); onSuccess(); }
  });
};
