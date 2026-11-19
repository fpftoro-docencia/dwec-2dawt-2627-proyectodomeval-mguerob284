/**
 * Componente accesible para alternar la visibilidad de campos de contraseña (ojo mostrar/ocultar).
 * Usa delegación de eventos sobre el formulario contenedor.
 * @module componentes/claveVisible
 */

/**
 * Conecta un oyente delegado sobre un formulario o contenedor para los botones con `data-alternar-clave`.
 * @param {HTMLElement} contenedor - Formulario o contenedor que alberga los botones.
 * @param {Document} [doc=document]
 * @listens MouseEvent#click
 */
export function vincularBotonesVerClave(contenedor, doc = document) {
  if (!contenedor) return;

  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-alternar-clave]');
    if (!boton) return;

    const idCampo = boton.dataset.alternarClave;
    const campo = doc.getElementById(idCampo);
    if (!campo) return;

    const seraVisible = campo.type === 'password';
    campo.type = seraVisible ? 'text' : 'password';

    const textoAccion = seraVisible ? 'Ocultar contraseña' : 'Mostrar contraseña';
    boton.setAttribute('aria-pressed', String(seraVisible));
    boton.setAttribute('aria-label', textoAccion);
    boton.setAttribute('title', textoAccion);

    const iconoMostrar = boton.querySelector('[data-icono="mostrar"]');
    const iconoOcultar = boton.querySelector('[data-icono="ocultar"]');
    if (iconoMostrar) iconoMostrar.hidden = seraVisible;
    if (iconoOcultar) iconoOcultar.hidden = !seraVisible;
  });
}
