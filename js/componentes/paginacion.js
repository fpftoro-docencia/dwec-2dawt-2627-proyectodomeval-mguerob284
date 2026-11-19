/**
 * Componente reutilizable de controles de paginación y sincronización con la URL.
 * Compartido por el listado de partidas (`listado.html`) y la zona de administración (`usuarios.html`).
 * @module componentes/paginacion
 */

/**
 * Lee el parámetro `?pagina=` de la barra de direcciones.
 * @param {string} [search=window.location.search]
 * @returns {number} Número de página solicitado (1 por defecto).
 */
export function leerPaginaDeUrl(search = window.location.search) {
  const parametros = new URLSearchParams(search);
  const valor = Number.parseInt(parametros.get('pagina') || '1', 10);
  return Number.isNaN(valor) || valor < 1 ? 1 : valor;
}

/**
 * Sincroniza el número de página actual en la URL con `history.replaceState`.
 * @param {number} pagina - Página activa tras la corrección.
 * @param {History} [historial=window.history]
 * @param {Location} [localizacion=window.location]
 */
export function actualizarPaginaEnUrl(
  pagina,
  historial = window.history,
  localizacion = window.location,
) {
  if (!historial || typeof historial.replaceState !== 'function' || !localizacion) {
    return;
  }
  const parametros = new URLSearchParams(localizacion.search);
  if (pagina > 1) {
    parametros.set('pagina', String(pagina));
  } else {
    parametros.delete('pagina');
  }
  const consulta = parametros.toString();
  const sufijoConsulta = consulta ? `?${consulta}` : '';
  const nuevaUrl = `${localizacion.pathname}${sufijoConsulta}${localizacion.hash || ''}`;
  historial.replaceState(null, '', nuevaUrl);
}

/**
 * Crea un elemento `<li>` con su botón de paginación accesible de Bootstrap.
 * @param {Document} doc
 * @param {Object} opciones
 * @param {string} opciones.texto
 * @param {number} opciones.paginaDestino
 * @param {boolean} [opciones.activo=false]
 * @param {boolean} [opciones.desactivado=false]
 * @param {string} [opciones.ariaLabel]
 * @returns {HTMLLIElement}
 */
function crearItemPagina(
  doc,
  { texto, paginaDestino, activo = false, desactivado = false, ariaLabel },
) {
  const item = doc.createElement('li');
  item.className = 'page-item';
  if (activo) item.classList.add('active');
  if (desactivado) item.classList.add('disabled');

  const boton = doc.createElement('button');
  boton.type = 'button';
  boton.className = 'page-link';
  boton.textContent = texto;
  boton.dataset.pagina = String(paginaDestino);
  boton.disabled = desactivado;

  if (activo) {
    boton.setAttribute('aria-current', 'page');
  }
  if (ariaLabel) {
    boton.setAttribute('aria-label', ariaLabel);
  }

  item.append(boton);
  return item;
}

/**
 * Renderiza los controles «Anterior», números de página y «Siguiente» usando métodos del DOM.
 * @param {HTMLElement} contenedor - Elemento donde se insertan los controles.
 * @param {{pagina: number, totalPaginas: number}} estadoPaginacion
 * @param {Document} [doc=document]
 */
export function renderizarPaginacion(contenedor, { pagina, totalPaginas }, doc = document) {
  if (!contenedor) return;

  const nav = doc.createElement('nav');
  nav.setAttribute('aria-label', 'Paginación de resultados');

  const lista = doc.createElement('ul');
  lista.className = 'pagination justify-content-center mb-0 flex-wrap gap-1';

  lista.append(
    crearItemPagina(doc, {
      texto: 'Anterior',
      paginaDestino: Math.max(1, pagina - 1),
      desactivado: pagina <= 1,
      ariaLabel: 'Página anterior',
    }),
  );

  for (let numero = 1; numero <= totalPaginas; numero += 1) {
    lista.append(
      crearItemPagina(doc, {
        texto: String(numero),
        paginaDestino: numero,
        activo: numero === pagina,
      }),
    );
  }

  lista.append(
    crearItemPagina(doc, {
      texto: 'Siguiente',
      paginaDestino: Math.min(totalPaginas, pagina + 1),
      desactivado: pagina >= totalPaginas,
      ariaLabel: 'Página siguiente',
    }),
  );

  nav.append(lista);
  contenedor.replaceChildren(nav);
}

/**
 * Conecta un único oyente delegado sobre el contenedor de paginación (fase burbuja).
 * @param {HTMLElement} contenedor
 * @param {Function} alCambiarPagina - Función de retorno con la nueva página.
 * @listens MouseEvent#click
 */
export function vincularPaginacion(contenedor, alCambiarPagina) {
  if (!contenedor) return;

  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-pagina]');
    if (!boton || boton.disabled) return;
    const nuevaPagina = Number.parseInt(boton.dataset.pagina, 10);
    if (!Number.isNaN(nuevaPagina)) {
      alCambiarPagina(nuevaPagina);
    }
  });
}
