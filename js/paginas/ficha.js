/**
 * Controlador de la ficha de alta y edición de recuerdos de partidas (`ficha.html`).
 *
 * Elementos HTML requeridos:
 * - `#cabecera-principal`, `#zona-avisos`, `#titulo-ficha`, `#form-partida`
 * - `#codigo-registro`, `#titulo`, `#edicion`, `#fecha-victoria`, `#tiempo-juego`, `#id-entrenador`
 * - `#lista-equipo`, `#contador-equipo`, `#btn-anadir-pokemon`, `#plantilla-pokemon`
 * - `#hubo-leyendas-caidas`, `#bloque-leyendas-caidas`, `#lista-leyendas`, `#contador-leyendas`,
 *   `#btn-anadir-leyenda`, `#plantilla-leyenda-caida`, `#btn-guardar-partida`
 *
 * @module paginas/ficha
 */

import { protegerPagina, renderizarCabecera } from '../componentes/cabecera.js';
import { inicializarAvisos, lanzarAviso, guardarAvisoPendiente } from '../avisos.js';
import { configurarValidacionFormulario } from '../componentes/validacionFormulario.js';
import {
  EDICIONES_OFICIALES,
  obtenerFechaHoyIso,
  validarFechaVictoria,
  validarModalidadesLocke,
} from '../validadores.js';
import { buscarPartidaPorId, crearPartida, actualizarPartida } from '../datos/partidas.js';
import { obtenerCaratulaEdicion } from '../datos/ediciones.js';

export const MIN_POKEMON_EQUIPO = 1;
export const MAX_POKEMON_EQUIPO = 6;
export const MIN_LEYENDAS_CAIDAS = 1;
export const MAX_LEYENDAS_CAIDAS = 6;

/**
 * Rellena el desplegable de ediciones oficiales con métodos del DOM.
 * @param {HTMLSelectElement} selectorEdicion
 * @param {Document} doc
 */
function poblarEdiciones(selectorEdicion, doc) {
  const primera = doc.createElement('option');
  primera.value = '';
  primera.textContent = 'Selecciona una edición';

  const opciones = EDICIONES_OFICIALES.map((edicion) => {
    const opcion = doc.createElement('option');
    opcion.value = edicion;
    opcion.textContent = edicion;
    return opcion;
  });

  selectorEdicion.replaceChildren(primera, ...opciones);
}

/**
 * Crea la galería visual de carátulas clicables sincronizada con el desplegable de edición.
 * @param {HTMLElement|null} contenedor
 * @param {Document} doc
 */
function poblarSelectorCaratulas(contenedor, doc) {
  if (!contenedor) return;

  const botones = EDICIONES_OFICIALES.map((edicion) => {
    const boton = doc.createElement('button');
    boton.type = 'button';
    boton.className = 'btn-caratula';
    boton.dataset.edicion = edicion;
    boton.setAttribute('aria-pressed', 'false');
    boton.title = `Elegir Pokémon ${edicion}`;

    const imagen = doc.createElement('img');
    imagen.src = obtenerCaratulaEdicion(edicion);
    imagen.alt = `Carátula de Pokémon ${edicion}`;
    imagen.loading = 'lazy';

    const etiqueta = doc.createElement('span');
    etiqueta.textContent = edicion;

    boton.append(imagen, etiqueta);
    return boton;
  });

  contenedor.replaceChildren(...botones);
}

/**
 * Inicializa el formulario de ficha en modo alta (`ficha.html`) o edición (`ficha.html?id=...`).
 * @param {Object} [deps={}]
 * @param {Document} [deps.doc=document]
 * @param {Storage} [deps.almacenPartidas=localStorage]
 * @param {Storage} [deps.almacenSesion=sessionStorage]
 * @param {Location} [deps.localizacion=window.location]
 * @param {Date} [deps.fechaReferencia=new Date()]
 * @fires CustomEvent#aviso
 */
export function iniciarFicha({
  doc = document,
  almacenPartidas = localStorage,
  almacenSesion = sessionStorage,
  localizacion = window.location,
  fechaReferencia = new Date(),
} = {}) {
  inicializarAvisos(doc);

  const sesion = protegerPagina({ almacen: almacenSesion, localizacion });
  if (!sesion) return;

  renderizarCabecera(
    doc.getElementById('cabecera-principal'),
    sesion,
    'ficha.html',
    almacenSesion,
    localizacion,
  );

  const formulario = doc.getElementById('form-partida');
  const tituloFicha = doc.getElementById('titulo-ficha');
  const campoCodigo = doc.getElementById('codigo-registro');
  const campoTitulo = doc.getElementById('titulo');
  const campoEdicion = doc.getElementById('edicion');
  const selectorCaratulas = doc.getElementById('selector-caratulas');
  const campoFecha = doc.getElementById('fecha-victoria');
  const campoTiempo = doc.getElementById('tiempo-juego');
  const campoIdEntrenador = doc.getElementById('id-entrenador');
  const radioClasica = doc.getElementById('tipo-clasica');
  const radioLocke = doc.getElementById('tipo-locke');
  const bloqueLocke = doc.getElementById('bloque-modalidades-locke');
  const errorModalidadesLocke = doc.getElementById('error-modalidades-locke');
  const listaEquipo = doc.getElementById('lista-equipo');
  const contadorEquipo = doc.getElementById('contador-equipo');
  const btnAnadirPokemon = doc.getElementById('btn-anadir-pokemon');
  const plantillaPokemon = doc.getElementById('plantilla-pokemon');
  const campoLeyendas = doc.getElementById('hubo-leyendas-caidas');
  const bloqueLeyendas = doc.getElementById('bloque-leyendas-caidas');
  const listaLeyendas = doc.getElementById('lista-leyendas');
  const contadorLeyendas = doc.getElementById('contador-leyendas');
  const btnAnadirLeyenda = doc.getElementById('btn-anadir-leyenda');
  const plantillaLeyenda = doc.getElementById('plantilla-leyenda-caida');
  const btnGuardar = doc.getElementById('btn-guardar-partida');

  if (!formulario || !listaEquipo || !plantillaPokemon) return;

  poblarEdiciones(campoEdicion, doc);
  poblarSelectorCaratulas(selectorCaratulas, doc);

  /**
   * Marca visualmente en el selector de carátulas la edición actualmente elegida.
   * @param {string} edicionActiva
   * @param {boolean} [desplazar=false]
   */
  function sincronizarCaratulaActiva(edicionActiva, desplazar = false) {
    if (!selectorCaratulas) return;
    const botones = selectorCaratulas.querySelectorAll('button[data-edicion]');
    botones.forEach((boton) => {
      const esActiva = boton.dataset.edicion === edicionActiva;
      boton.classList.toggle('activa', esActiva);
      boton.setAttribute('aria-pressed', String(esActiva));
      if (esActiva && desplazar && typeof boton.scrollIntoView === 'function') {
        boton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  // Requisito 17: atributo `max` dinámico calculado desde el código según la fecha actual
  campoFecha.max = obtenerFechaHoyIso(fechaReferencia);

  const validador = configurarValidacionFormulario(formulario, {
    doc,
    reglasExtra: {
      'fecha-victoria': (campo) => validarFechaVictoria(campo.value, fechaReferencia),
    },
  });

  let contadorFilasEquipo = 0;
  let contadorFilasLeyendas = 0;

  /**
   * Devuelve las casillas de submodalidades Locke dentro del formulario.
   * @returns {HTMLInputElement[]}
   */
  function obtenerCasillasLocke() {
    return Array.from(formulario.querySelectorAll('input[name="modalidadesLocke"]'));
  }

  /**
   * Valida las modalidades Locke cuando el tipo de partida es 'Locke'.
   * @returns {{valido: boolean, primerError: HTMLElement|null}}
   */
  function comprobarModalidadesLocke() {
    const casillas = obtenerCasillasLocke();
    const esLocke = Boolean(radioLocke?.checked);

    if (!esLocke) {
      casillas.forEach((casilla) => {
        casilla.classList.remove('is-invalid');
        casilla.removeAttribute('aria-invalid');
      });
      if (errorModalidadesLocke) errorModalidadesLocke.textContent = '';
      return { valido: true, primerError: null };
    }

    const elegidas = casillas.filter((casilla) => casilla.checked).map((casilla) => casilla.value);
    const resultado = validarModalidadesLocke(elegidas);

    casillas.forEach((casilla) => {
      casilla.classList.toggle('is-invalid', !resultado.valido);
      casilla.setAttribute('aria-invalid', String(!resultado.valido));
    });

    if (errorModalidadesLocke) {
      errorModalidadesLocke.textContent = resultado.valido ? '' : resultado.motivo || '';
    }

    return {
      valido: resultado.valido,
      primerError: resultado.valido ? null : casillas[0] || null,
    };
  }

  /**
   * Muestra u oculta y activa/desactiva las modalidades Locke según el radio seleccionado.
   * @param {boolean} esLocke
   */
  function actualizarBloqueLocke(esLocke) {
    if (!bloqueLocke) return;
    bloqueLocke.hidden = !esLocke;
    const casillas = obtenerCasillasLocke();
    casillas.forEach((casilla) => {
      casilla.disabled = !esLocke;
      if (!esLocke) {
        casilla.checked = false;
        casilla.classList.remove('is-invalid');
        casilla.removeAttribute('aria-invalid');
      }
    });
    if (!esLocke && errorModalidadesLocke) {
      errorModalidadesLocke.textContent = '';
    }
  }

  /**
   * Actualiza la numeración visual del equipo campeón y el estado desactivado de sus botones.
   */
  function actualizarEstadoEquipo() {
    const filas = Array.from(listaEquipo.querySelectorAll('[data-fila-pokemon]'));
    const total = filas.length;

    filas.forEach((fila, indice) => {
      const leyenda = fila.querySelector('[data-titulo-pokemon]');
      if (leyenda) {
        leyenda.textContent = `Pokémon #${indice + 1}`;
      }
      const btnQuitar = fila.querySelector('[data-accion="quitar-pokemon"]');
      if (btnQuitar) {
        btnQuitar.disabled = total <= MIN_POKEMON_EQUIPO;
      }
    });

    if (btnAnadirPokemon) {
      btnAnadirPokemon.disabled = total >= MAX_POKEMON_EQUIPO;
    }

    if (contadorEquipo) {
      contadorEquipo.textContent = `${total} de ${MAX_POKEMON_EQUIPO} Pokémon en tu equipo`;
    }
  }

  /**
   * Añade una fila al equipo campeón desde `<template>` con ids, `htmlFor` y cajas de error únicos.
   * @param {{mote?: string, nivel?: number|string, movimientoClave?: string}} [datos={}]
   */
  function anadirFilaPokemon(datos = {}) {
    const actuales = listaEquipo.querySelectorAll('[data-fila-pokemon]').length;
    if (actuales >= MAX_POKEMON_EQUIPO) return;

    contadorFilasEquipo += 1;
    const sufijo = contadorFilasEquipo;
    const fragmento = plantillaPokemon.content.cloneNode(true);

    const campos = [
      { clave: 'mote', valor: datos.mote ?? '' },
      { clave: 'nivel', valor: datos.nivel ?? '' },
      { clave: 'movimiento', valor: datos.movimientoClave ?? '' },
    ];

    for (const { clave, valor } of campos) {
      const idCampo = `pokemon-${clave}-${sufijo}`;
      const idError = `error-${idCampo}`;
      const etiqueta = fragmento.querySelector(`[data-etiqueta="${clave}"]`);
      const control = fragmento.querySelector(`[data-campo="${clave}"]`);
      const cajaError = fragmento.querySelector(`[data-error="${clave}"]`);

      if (etiqueta) etiqueta.htmlFor = idCampo;
      if (cajaError) cajaError.id = idError;
      if (control) {
        control.id = idCampo;
        control.dataset.errorId = idError;
        control.setAttribute('aria-describedby', idError);
        control.value = String(valor);
      }
    }

    listaEquipo.append(fragmento);
    actualizarEstadoEquipo();
  }

  /**
   * Actualiza la numeración de las Leyendas Caídas y activa/desactiva sus controles según la casilla.
   */
  function actualizarEstadoLeyendas() {
    if (!listaLeyendas) return;
    const activo = Boolean(campoLeyendas?.checked);
    const filas = Array.from(listaLeyendas.querySelectorAll('[data-fila-leyenda]'));
    const total = filas.length;

    filas.forEach((fila, indice) => {
      const leyenda = fila.querySelector('[data-titulo-leyenda]');
      if (leyenda) {
        leyenda.textContent = `⭐ Leyenda Caída #${indice + 1}`;
      }
      const controles = fila.querySelectorAll('input, select, textarea');
      controles.forEach((control) => {
        control.disabled = !activo;
        if (!activo) {
          validador.limpiarCampo(control);
        }
      });
      const btnQuitar = fila.querySelector('[data-accion="quitar-leyenda"]');
      if (btnQuitar) {
        btnQuitar.disabled = !activo || total <= MIN_LEYENDAS_CAIDAS;
      }
    });

    if (btnAnadirLeyenda) {
      btnAnadirLeyenda.disabled = !activo || total >= MAX_LEYENDAS_CAIDAS;
    }

    if (contadorLeyendas) {
      contadorLeyendas.textContent = `${total} de ${MAX_LEYENDAS_CAIDAS} leyendas caídas en tu corazón`;
    }
  }

  /**
   * Añade una fila condicional de Leyenda Caída desde `<template>` con ids y cajas de error únicos.
   * @param {{mote?: string, nivel?: number|string, hazana?: string}} [datos={}]
   */
  function anadirFilaLeyenda(datos = {}) {
    if (!listaLeyendas || !plantillaLeyenda) return;
    const actuales = listaLeyendas.querySelectorAll('[data-fila-leyenda]').length;
    if (actuales >= MAX_LEYENDAS_CAIDAS) return;

    contadorFilasLeyendas += 1;
    const sufijo = contadorFilasLeyendas;
    const fragmento = plantillaLeyenda.content.cloneNode(true);

    const campos = [
      { clave: 'mote', valor: datos.mote ?? '' },
      { clave: 'nivel', valor: datos.nivel ?? '' },
      { clave: 'hazana', valor: datos.hazana ?? '' },
    ];

    for (const { clave, valor } of campos) {
      const idCampo = `leyenda-${clave}-${sufijo}`;
      const idError = `error-${idCampo}`;
      const etiqueta = fragmento.querySelector(`[data-etiqueta="${clave}"]`);
      const control = fragmento.querySelector(`[data-campo="${clave}"]`);
      const cajaError = fragmento.querySelector(`[data-error="${clave}"]`);

      if (etiqueta) etiqueta.htmlFor = idCampo;
      if (cajaError) cajaError.id = idError;
      if (control) {
        control.id = idCampo;
        control.dataset.errorId = idError;
        control.setAttribute('aria-describedby', idError);
        control.value = String(valor);
      }
    }

    listaLeyendas.append(fragmento);
    actualizarEstadoLeyendas();
  }

  /**
   * Muestra u oculta y activa/desactiva el bloque condicional de Leyendas Caídas (`hidden` y `disabled`).
   * @param {boolean} activo
   */
  function actualizarBloqueLeyendas(activo) {
    if (!bloqueLeyendas || !listaLeyendas) return;
    bloqueLeyendas.hidden = !activo;
    if (activo && listaLeyendas.querySelectorAll('[data-fila-leyenda]').length === 0) {
      anadirFilaLeyenda();
    } else {
      actualizarEstadoLeyendas();
    }
  }

  // Comprobar si estamos editando un registro existente (`ficha.html?id=...`)
  const parametros = new URLSearchParams(localizacion.search);
  const idEdicion = parametros.get('id');
  let partidaEditada = null;

  if (idEdicion) {
    partidaEditada = buscarPartidaPorId(sesion.nombreUsuario, idEdicion, almacenPartidas);
    if (!partidaEditada) {
      guardarAvisoPendiente('No se encontró el recuerdo solicitado', 'danger');
      localizacion.replace('listado.html');
      return;
    }

    if (tituloFicha) {
      tituloFicha.textContent = '✏️ Editar Recuerdo de Partida';
    }
    if (btnGuardar) {
      btnGuardar.textContent = 'Guardar cambios';
    }

    campoCodigo.value = partidaEditada.codigoRegistro;
    campoTitulo.value = partidaEditada.titulo;
    campoEdicion.value = partidaEditada.edicion;
    sincronizarCaratulaActiva(partidaEditada.edicion, false);
    campoFecha.value = partidaEditada.fechaVictoria;
    campoTiempo.value = partidaEditada.tiempoJuego;
    campoIdEntrenador.value =
      partidaEditada.idEntrenador || partidaEditada.licenciaEntrenador || '';

    const esLocke = partidaEditada.tipoPartida === 'Locke';
    if (radioClasica) radioClasica.checked = !esLocke;
    if (radioLocke) radioLocke.checked = esLocke;
    actualizarBloqueLocke(esLocke);
    if (esLocke && Array.isArray(partidaEditada.modalidadesLocke)) {
      obtenerCasillasLocke().forEach((casilla) => {
        casilla.checked = partidaEditada.modalidadesLocke.includes(casilla.value);
      });
    }

    const equipoGuardado =
      Array.isArray(partidaEditada.equipo) && partidaEditada.equipo.length > 0
        ? partidaEditada.equipo
        : [{}];
    for (const miembro of equipoGuardado.slice(0, MAX_POKEMON_EQUIPO)) {
      anadirFilaPokemon(miembro);
    }

    const huboLeyendas = Boolean(partidaEditada.huboLeyendasCaidas);
    campoLeyendas.checked = huboLeyendas;
    if (huboLeyendas && Array.isArray(partidaEditada.leyendasCaidas)) {
      for (const leyenda of partidaEditada.leyendasCaidas.slice(0, MAX_LEYENDAS_CAIDAS)) {
        anadirFilaLeyenda(leyenda);
      }
    }
    actualizarBloqueLeyendas(huboLeyendas);
  } else {
    actualizarBloqueLocke(false);
    anadirFilaPokemon();
    actualizarBloqueLeyendas(false);
  }

  // Sincronización bidireccional entre el desplegable y la galería visual de carátulas
  campoEdicion.addEventListener('change', () => {
    sincronizarCaratulaActiva(campoEdicion.value, true);
  });

  if (selectorCaratulas) {
    selectorCaratulas.addEventListener('click', (evento) => {
      const boton = evento.target.closest('button[data-edicion]');
      if (!boton) return;
      campoEdicion.value = boton.dataset.edicion;
      sincronizarCaratulaActiva(campoEdicion.value, false);
      campoEdicion.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  // Radio excluyente Clásica / Locke y revalidación de submodalidades
  if (radioClasica) {
    radioClasica.addEventListener('change', () => {
      actualizarBloqueLocke(false);
    });
  }
  if (radioLocke) {
    radioLocke.addEventListener('change', () => {
      actualizarBloqueLocke(true);
    });
  }
  if (bloqueLocke) {
    bloqueLocke.addEventListener('change', (evento) => {
      if (evento.target.matches('input[name="modalidadesLocke"]')) {
        comprobarModalidadesLocke();
      }
    });
  }

  // Casilla condicional: mostrar y habilitar las Leyendas Caídas
  campoLeyendas.addEventListener('change', () => {
    actualizarBloqueLeyendas(campoLeyendas.checked);
  });

  // Botón añadir fila del equipo campeón
  if (btnAnadirPokemon) {
    btnAnadirPokemon.addEventListener('click', () => {
      anadirFilaPokemon();
    });
  }

  // Botón añadir fila de Leyendas Caídas
  if (btnAnadirLeyenda) {
    btnAnadirLeyenda.addEventListener('click', () => {
      anadirFilaLeyenda();
    });
  }

  // Delegación de eventos en `#lista-equipo` para quitar un Pokémon campeón (Requisito 20)
  listaEquipo.addEventListener('click', (evento) => {
    const btnQuitar = evento.target.closest('button[data-accion="quitar-pokemon"]');
    if (!btnQuitar || btnQuitar.disabled) return;

    const filas = listaEquipo.querySelectorAll('[data-fila-pokemon]');
    if (filas.length <= MIN_POKEMON_EQUIPO) return;

    const fila = btnQuitar.closest('[data-fila-pokemon]');
    if (fila) {
      fila.remove();
      actualizarEstadoEquipo();
    }
  });

  // Delegación de eventos en `#lista-leyendas` para quitar una Leyenda Caída
  if (listaLeyendas) {
    listaLeyendas.addEventListener('click', (evento) => {
      const btnQuitar = evento.target.closest('button[data-accion="quitar-leyenda"]');
      if (!btnQuitar || btnQuitar.disabled) return;

      const filas = listaLeyendas.querySelectorAll('[data-fila-leyenda]');
      if (filas.length <= MIN_LEYENDAS_CAIDAS) return;

      const fila = btnQuitar.closest('[data-fila-leyenda]');
      if (fila) {
        fila.remove();
        actualizarEstadoLeyendas();
      }
    });
  }

  let procesandoEnvio = false;

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (procesandoEnvio) return;

    const { valido, primerError } = validador.validarFormulario();
    const resultadoLocke = comprobarModalidadesLocke();
    if (!valido || !resultadoLocke.valido) {
      lanzarAviso(formulario, 'Revisa los campos marcados en rojo antes de guardar', 'warning');
      const focoDestino = primerError || resultadoLocke.primerError;
      if (focoDestino) focoDestino.focus();
      return;
    }

    procesandoEnvio = true;
    if (btnGuardar) {
      btnGuardar.disabled = true;
    }

    try {
      // Requisito 17: lectura con FormData (`get` y `getAll` para los grupos dinámicos)
      const datosFormulario = new FormData(formulario);
      const motes = datosFormulario.getAll('pokemonMote');
      const niveles = datosFormulario.getAll('pokemonNivel');
      const movimientos = datosFormulario.getAll('pokemonMovimiento');

      const equipo = motes.map((mote, indice) => ({
        mote: String(mote),
        nivel: Number(niveles[indice]),
        movimientoClave: String(movimientos[indice]),
      }));

      const huboLeyendasCaidas = datosFormulario.get('huboLeyendasCaidas') !== null;
      const leyendasCaidas = huboLeyendasCaidas
        ? datosFormulario.getAll('leyendaMote').map((mote, indice) => ({
            mote: String(mote),
            nivel: Number(datosFormulario.getAll('leyendaNivel')[indice]),
            hazana: String(datosFormulario.getAll('leyendaHazana')[indice]),
          }))
        : [];

      const tipoPartida =
        String(datosFormulario.get('tipoPartida') || 'Clásica') === 'Locke' ? 'Locke' : 'Clásica';
      const modalidadesLocke =
        tipoPartida === 'Locke'
          ? datosFormulario.getAll('modalidadesLocke').map((mod) => String(mod))
          : [];

      const registro = {
        codigoRegistro: String(datosFormulario.get('codigoRegistro') || ''),
        titulo: String(datosFormulario.get('titulo') || ''),
        edicion: String(datosFormulario.get('edicion') || ''),
        fechaVictoria: String(datosFormulario.get('fechaVictoria') || ''),
        tiempoJuego: String(datosFormulario.get('tiempoJuego') || ''),
        idEntrenador: String(datosFormulario.get('idEntrenador') || ''),
        tipoPartida,
        modalidadesLocke,
        huboLeyendasCaidas,
        leyendasCaidas,
        equipo,
      };

      if (partidaEditada) {
        actualizarPartida(sesion.nombreUsuario, partidaEditada.id, registro, almacenPartidas);
        guardarAvisoPendiente('Recuerdo actualizado correctamente', 'success');
      } else {
        crearPartida(sesion.nombreUsuario, registro, almacenPartidas);
        guardarAvisoPendiente('Recuerdo guardado en tu vitrina', 'success');
      }

      localizacion.replace('listado.html');
    } catch {
      lanzarAviso(formulario, 'No se pudo guardar el recuerdo en este momento', 'danger');
      procesandoEnvio = false;
      if (btnGuardar) {
        btnGuardar.disabled = false;
      }
    }
  });
}
