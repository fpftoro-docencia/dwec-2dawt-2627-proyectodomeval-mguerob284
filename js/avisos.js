/**
 * Sistema de gestión y emisión de avisos mediante eventos del DOM.
 * @module avisos
 */

const CLAVE_AVISO_PENDIENTE = 'PokeMemories_aviso_pendiente';

/**
 * Emite un evento personalizado 'aviso' que burbujea hasta document.
 * @param {HTMLElement} emisor - Elemento desde el que se lanza el evento.
 * @param {string} mensaje - Texto del aviso a mostrar.
 * @param {'success'|'danger'|'warning'|'info'} [tipo='info'] - Tipo de aviso (clases Bootstrap).
 * @fires CustomEvent#aviso
 */
export function lanzarAviso(emisor, mensaje, tipo = 'info') {
  const evento = new CustomEvent('aviso', {
    bubbles: true,
    detail: { mensaje, tipo }
  });
  emisor.dispatchEvent(evento);
}

/**
 * Guarda un aviso en sessionStorage para ser mostrado en la siguiente página tras navegar.
 * @param {string} mensaje
 * @param {'success'|'danger'|'warning'|'info'} [tipo='info']
 */
export function guardarAvisoPendiente(mensaje, tipo = 'info') {
  try {
    sessionStorage.setItem(
      CLAVE_AVISO_PENDIENTE,
      JSON.stringify({ mensaje, tipo })
    );
  } catch {
    // Si sessionStorage no está disponible, se ignora silenciosamente
  }
}

/**
 * Consume y devuelve el aviso pendiente si existe en sessionStorage.
 * @returns {{mensaje: string, tipo: string}|null}
 */
export function consumirAvisoPendiente() {
  try {
    const datos = sessionStorage.getItem(CLAVE_AVISO_PENDIENTE);
    if (!datos) return null;
    sessionStorage.removeItem(CLAVE_AVISO_PENDIENTE);
    return JSON.parse(datos);
  } catch {
    return null;
  }
}

/**
 * Inicializa el oyente global de avisos en document y muestra los pendientes si los hay.
 * @param {Document} [doc=document]
 */
export function inicializarAvisos(doc = document) {
  const zonaAvisos = doc.getElementById('zona-avisos');
  if (!zonaAvisos) return;

  // Oyente único en document para el evento propio 'aviso' (fase burbuja)
  doc.addEventListener('aviso', (evento) => {
    const { mensaje, tipo = 'info' } = evento.detail || {};
    if (!mensaje) return;

    zonaAvisos.innerHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        <span>${mensaje}</span>
        <button type="button" class="btn-close" aria-label="Cerrar"></button>
      </div>
    `;

    const botonCerrar = zonaAvisos.querySelector('.btn-close');
    if (botonCerrar) {
      botonCerrar.addEventListener('click', () => {
        zonaAvisos.innerHTML = '';
      });
    }
  });

  // Comprobar si había un aviso pendiente guardado de la página anterior
  const pendiente = consumirAvisoPendiente();
  if (pendiente) {
    lanzarAviso(zonaAvisos, pendiente.mensaje, pendiente.tipo);
  }
}
