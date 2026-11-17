/**
 * Controlador de la página de listado de recuerdos de partidas (`listado.html`).
 *
 * Elementos HTML requeridos:
 * - `#cabecera-principal`, `#zona-avisos`
 * - `#buscador-partidas`, `#contador-resultados`
 * - `#lista-partidas`, `#estado-vacio`, `#estado-vacio-titulo`, `#estado-vacio-subtitulo`
 * - `#paginacion-partidas`, `#plantilla-partida`
 * - `#dialogo-borrar`, `#dialogo-borrar-nombre`, `#btn-cancelar-borrado`, `#btn-confirmar-borrado`
 *
 * @module paginas/listado
 */

import { protegerPagina, renderizarCabecera } from '../componentes/cabecera.js';
import { inicializarAvisos, lanzarAviso } from '../avisos.js';
import { obtenerPartidas, eliminarPartida } from '../datos/partidas.js';
import { filtrarLista, paginar } from '../paginacion.js';
import {
  leerPaginaDeUrl,
  actualizarPaginaEnUrl,
  renderizarPaginacion,
  vincularPaginacion,
} from '../componentes/paginacion.js';

export const POR_PAGINA_LISTADO = 6;
export const RETARDO_BUSQUEDA_MS = 250;

/**
 * Construye el texto buscable de una partida para el filtro sin tildes ni mayúsculas.
 * @param {import('../datos/partidas.js').RegistroPartida} partida
 * @returns {string}
 */
function textoBuscablePartida(partida) {
  const motes = Array.isArray(partida.equipo)
    ? partida.equipo.map((miembro) => `${miembro.mote} ${miembro.movimientoClave}`).join(' ')
    : '';
  const leyendas = Array.isArray(partida.leyendasCaidas)
    ? partida.leyendasCaidas.map((leyenda) => `${leyenda.mote} ${leyenda.hazana}`).join(' ')
    : '';
  return [
    partida.codigoRegistro,
    partida.titulo,
    partida.edicion,
    partida.licenciaEntrenador,
    motes,
    leyendas,
  ].join(' ');
}

/**
 * Crea el nodo de tarjeta de una partida a partir de `<template id="plantilla-partida">`.
 * Rellena únicamente con `textContent` y atributos (sin `innerHTML` ni estilos en JS).
 * @param {HTMLTemplateElement} plantilla
 * @param {import('../datos/partidas.js').RegistroPartida} partida
 * @param {Document} doc
 * @returns {DocumentFragment}
 */
function crearTarjetaPartida(plantilla, partida, doc) {
  const fragmento = plantilla.content.cloneNode(true);

  const ponerTexto = (campo, valor) => {
    const nodo = fragmento.querySelector(`[data-campo="${campo}"]`);
    if (nodo) nodo.textContent = valor;
  };

  ponerTexto('codigoRegistro', partida.codigoRegistro);
  ponerTexto('edicion', partida.edicion);
  ponerTexto('titulo', partida.titulo);
  ponerTexto('fechaVictoria', partida.fechaVictoria);
  ponerTexto('tiempoJuego', `${partida.tiempoJuego} h`);
  ponerTexto('licenciaEntrenador', partida.licenciaEntrenador);

  const listaEquipo = fragmento.querySelector('[data-campo="equipo"]');
  if (listaEquipo && Array.isArray(partida.equipo)) {
    const chips = partida.equipo.map((miembro) => {
      const item = doc.createElement('li');
      item.className = 'badge bg-light text-dark border';
      item.textContent = `${miembro.mote} Nv.${miembro.nivel}`;
      item.title = `Movimiento clave: ${miembro.movimientoClave}`;
      return item;
    });
    listaEquipo.replaceChildren(...chips);
  }

  const bloqueLeyendas = fragmento.querySelector('[data-bloque="leyendas"]');
  const listaLeyendas = fragmento.querySelector('[data-campo="leyendasCaidas"]');
  if (bloqueLeyendas && listaLeyendas) {
    const tieneLeyendas =
      Boolean(partida.huboLeyendasCaidas) &&
      Array.isArray(partida.leyendasCaidas) &&
      partida.leyendasCaidas.length > 0;
    bloqueLeyendas.hidden = !tieneLeyendas;
    if (tieneLeyendas) {
      const itemsLeyendas = partida.leyendasCaidas.map((leyenda) => {
        const item = doc.createElement('li');
        const nombre = doc.createElement('strong');
        nombre.textContent = `★ ${leyenda.mote} (Nv.${leyenda.nivel})`;
        item.append(nombre, ` — ${leyenda.hazana}`);
        return item;
      });
      listaLeyendas.replaceChildren(...itemsLeyendas);
    } else {
      listaLeyendas.replaceChildren();
    }
  }

  const enlaceEditar = fragmento.querySelector('[data-accion="editar"]');
  if (enlaceEditar) {
    enlaceEditar.setAttribute('href', `ficha.html?id=${encodeURIComponent(partida.id)}`);
  }

  const botonBorrar = fragmento.querySelector('[data-accion="borrar"]');
  if (botonBorrar) {
    botonBorrar.dataset.id = partida.id;
    botonBorrar.dataset.titulo = partida.titulo;
  }

  return fragmento;
}

/**
 * Abre un diálogo HTML5 nativo con respaldo seguro para entornos de prueba sin `showModal`.
 * @param {HTMLDialogElement} dialogo
 */
function abrirDialogo(dialogo) {
  if (typeof dialogo.showModal === 'function') {
    dialogo.showModal();
  } else {
    dialogo.setAttribute('open', '');
  }
}

/**
 * Cierra un diálogo HTML5 nativo con respaldo seguro para entornos de prueba.
 * @param {HTMLDialogElement} dialogo
 */
function cerrarDialogo(dialogo) {
  if (typeof dialogo.close === 'function') {
    dialogo.close();
  } else {
    dialogo.removeAttribute('open');
  }
}

/**
 * Inicializa la página de listado de recuerdos con búsqueda, paginación y borrado confirmado.
 * @param {Object} [deps={}]
 * @param {Document} [deps.doc=document]
 * @param {Storage} [deps.almacenPartidas=localStorage]
 * @param {Storage} [deps.almacenSesion=sessionStorage]
 * @param {Location} [deps.localizacion=window.location]
 * @param {History} [deps.historial=window.history]
 * @param {number} [deps.porPagina=POR_PAGINA_LISTADO]
 * @param {number} [deps.retardoBusqueda=RETARDO_BUSQUEDA_MS]
 * @fires CustomEvent#aviso
 */
export function iniciarListado({
  doc = document,
  almacenPartidas = localStorage,
  almacenSesion = sessionStorage,
  localizacion = window.location,
  historial = window.history,
  porPagina = POR_PAGINA_LISTADO,
  retardoBusqueda = RETARDO_BUSQUEDA_MS,
} = {}) {
  inicializarAvisos(doc);

  const sesion = protegerPagina({ almacen: almacenSesion, localizacion });
  if (!sesion) return;

  renderizarCabecera(
    doc.getElementById('cabecera-principal'),
    sesion,
    'listado.html',
    almacenSesion,
    localizacion,
  );

  const listaContenedor = doc.getElementById('lista-partidas');
  const plantilla = doc.getElementById('plantilla-partida');
  const buscador = doc.getElementById('buscador-partidas');
  const contador = doc.getElementById('contador-resultados');
  const estadoVacio = doc.getElementById('estado-vacio');
  const estadoVacioTitulo = doc.getElementById('estado-vacio-titulo');
  const estadoVacioSubtitulo = doc.getElementById('estado-vacio-subtitulo');
  const paginacionContenedor = doc.getElementById('paginacion-partidas');
  const dialogoBorrar = doc.getElementById('dialogo-borrar');
  const dialogoNombre = doc.getElementById('dialogo-borrar-nombre');
  const btnCancelarBorrado = doc.getElementById('btn-cancelar-borrado');
  const btnConfirmarBorrado = doc.getElementById('btn-confirmar-borrado');

  if (!listaContenedor || !plantilla) return;

  let paginaActual = leerPaginaDeUrl(localizacion.search);
  let consultaActual = '';
  let temporizadorBusqueda = null;
  let idPendienteBorrar = null;

  /**
   * Actualiza el contador de resultados y el estado vacío según los datos filtrados.
   * @param {number} totalGeneral
   * @param {number} totalFiltrado
   * @param {number} mostrados
   */
  function actualizarResumen(totalGeneral, totalFiltrado, mostrados) {
    if (contador) {
      if (totalFiltrado === 0) {
        contador.textContent = '0 recuerdos encontrados';
      } else if (totalFiltrado === 1) {
        contador.textContent = '1 recuerdo encontrado';
      } else {
        contador.textContent = `Mostrando ${mostrados} de ${totalFiltrado} recuerdos`;
      }
    }

    if (estadoVacio) {
      const sinResultados = totalFiltrado === 0;
      estadoVacio.hidden = !sinResultados;
      if (sinResultados && estadoVacioTitulo && estadoVacioSubtitulo) {
        if (totalGeneral === 0) {
          estadoVacioTitulo.textContent = '🎮 Aún no has registrado ninguna partida en tu vitrina';
          estadoVacioSubtitulo.textContent =
            'Usa el botón de arriba para registrar tu primera partida en PokeMemories';
        } else {
          estadoVacioTitulo.textContent = '🔍 No hay recuerdos que coincidan con tu búsqueda';
          estadoVacioSubtitulo.textContent =
            'Prueba con otro título, código de registro, edición o Pokémon';
        }
      }
    }
  }

  /**
   * Lee las partidas del usuario, aplica el filtro, pagina y actualiza el DOM de una vez.
   */
  function renderizar() {
    const todas = obtenerPartidas(sesion.nombreUsuario, almacenPartidas);
    const filtradas = filtrarLista(todas, consultaActual, textoBuscablePartida);
    const resultado = paginar(filtradas, paginaActual, porPagina);

    paginaActual = resultado.pagina;
    actualizarPaginaEnUrl(paginaActual, historial, localizacion);

    const fragmento = doc.createDocumentFragment();
    for (const partida of resultado.elementos) {
      fragmento.append(crearTarjetaPartida(plantilla, partida, doc));
    }
    listaContenedor.replaceChildren(fragmento);

    actualizarResumen(todas.length, resultado.totalElementos, resultado.elementos.length);

    if (paginacionContenedor) {
      if (resultado.totalElementos > 0) {
        paginacionContenedor.hidden = false;
        renderizarPaginacion(paginacionContenedor, resultado, doc);
      } else {
        paginacionContenedor.hidden = true;
        paginacionContenedor.replaceChildren();
      }
    }
  }

  // Buscador con debounce (Requisito 15 y 16: al buscar vuelve a la página 1)
  if (buscador) {
    buscador.addEventListener('input', () => {
      clearTimeout(temporizadorBusqueda);
      temporizadorBusqueda = setTimeout(() => {
        consultaActual = buscador.value;
        paginaActual = 1;
        renderizar();
      }, retardoBusqueda);
    });
  }

  // Delegación de eventos para los controles de paginación
  if (paginacionContenedor) {
    vincularPaginacion(paginacionContenedor, (nuevaPagina) => {
      paginaActual = nuevaPagina;
      renderizar();
    });
  }

  // Delegación de eventos en el listado para el botón «Borrar» (Requisito 15 y 20)
  listaContenedor.addEventListener('click', (evento) => {
    const botonBorrar = evento.target.closest('button[data-accion="borrar"]');
    if (!botonBorrar || !dialogoBorrar) return;

    idPendienteBorrar = botonBorrar.dataset.id || null;
    if (dialogoNombre) {
      dialogoNombre.textContent = botonBorrar.dataset.titulo || 'esta partida';
    }
    abrirDialogo(dialogoBorrar);
  });

  if (btnCancelarBorrado && dialogoBorrar) {
    btnCancelarBorrado.addEventListener('click', () => {
      idPendienteBorrar = null;
      cerrarDialogo(dialogoBorrar);
    });
  }

  if (dialogoBorrar) {
    dialogoBorrar.addEventListener('cancel', () => {
      idPendienteBorrar = null;
    });
  }

  if (btnConfirmarBorrado && dialogoBorrar) {
    btnConfirmarBorrado.addEventListener('click', () => {
      if (!idPendienteBorrar) {
        cerrarDialogo(dialogoBorrar);
        return;
      }

      const eliminado = eliminarPartida(sesion.nombreUsuario, idPendienteBorrar, almacenPartidas);
      idPendienteBorrar = null;
      cerrarDialogo(dialogoBorrar);

      if (eliminado) {
        renderizar();
        lanzarAviso(listaContenedor, 'Recuerdo borrado correctamente', 'info');
      } else {
        lanzarAviso(listaContenedor, 'No se pudo encontrar el recuerdo para borrarlo', 'warning');
      }
    });
  }

  renderizar();
}
