/**
 * Controlador de la ficha de alta y edición de recuerdos de partidas (`ficha.html`).
 *
 * Elementos HTML requeridos:
 * - `#cabecera-principal`, `#zona-avisos`, `#titulo-ficha`, `#form-partida`
 * - `#codigo-registro`, `#titulo`, `#edicion`, `#fecha-victoria`, `#tiempo-juego`, `#licencia-entrenador`
 * - `#hubo-leyendas-caidas`, `#bloque-mencion-honor`, `#mencion-honor`
 * - `#lista-equipo`, `#contador-equipo`, `#btn-anadir-pokemon`, `#plantilla-pokemon`, `#btn-guardar-partida`
 *
 * @module paginas/ficha
 */

import { protegerPagina, renderizarCabecera } from '../componentes/cabecera.js';
import { inicializarAvisos, lanzarAviso, guardarAvisoPendiente } from '../avisos.js';
import { configurarValidacionFormulario } from '../componentes/validacionFormulario.js';
import { EDICIONES_OFICIALES, obtenerFechaHoyIso, validarFechaVictoria } from '../validadores.js';
import { buscarPartidaPorId, crearPartida, actualizarPartida } from '../datos/partidas.js';

export const MIN_POKEMON_EQUIPO = 1;
export const MAX_POKEMON_EQUIPO = 6;

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
  const campoFecha = doc.getElementById('fecha-victoria');
  const campoTiempo = doc.getElementById('tiempo-juego');
  const campoLicencia = doc.getElementById('licencia-entrenador');
  const campoLeyendas = doc.getElementById('hubo-leyendas-caidas');
  const bloqueMencion = doc.getElementById('bloque-mencion-honor');
  const campoMencion = doc.getElementById('mencion-honor');
  const listaEquipo = doc.getElementById('lista-equipo');
  const contadorEquipo = doc.getElementById('contador-equipo');
  const btnAnadirPokemon = doc.getElementById('btn-anadir-pokemon');
  const plantillaPokemon = doc.getElementById('plantilla-pokemon');
  const btnGuardar = doc.getElementById('btn-guardar-partida');

  if (!formulario || !listaEquipo || !plantillaPokemon) return;

  poblarEdiciones(campoEdicion, doc);

  // Requisito 17: atributo `max` dinámico calculado desde el código según la fecha actual
  campoFecha.max = obtenerFechaHoyIso(fechaReferencia);

  const validador = configurarValidacionFormulario(formulario, {
    doc,
    reglasExtra: {
      'fecha-victoria': (campo) => validarFechaVictoria(campo.value, fechaReferencia),
    },
  });

  let contadorFilasId = 0;

  /**
   * Muestra u oculta y activa/desactiva el campo condicional de mención de honor.
   * @param {boolean} activo
   */
  function actualizarCampoCondicional(activo) {
    bloqueMencion.hidden = !activo;
    campoMencion.disabled = !activo;
    if (!activo) {
      campoMencion.value = '';
      validador.limpiarCampo(campoMencion);
    }
  }

  /**
   * Actualiza la numeración visual de las filas de Pokémon y el estado desactivado de los botones.
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
   * Añade una fila al grupo dinámico desde `<template>` con ids, `htmlFor` y cajas de error únicos.
   * @param {{mote?: string, nivel?: number|string, estado?: string, movimientoClave?: string}} [datos={}]
   */
  function anadirFilaPokemon(datos = {}) {
    const actuales = listaEquipo.querySelectorAll('[data-fila-pokemon]').length;
    if (actuales >= MAX_POKEMON_EQUIPO) return;

    contadorFilasId += 1;
    const sufijo = contadorFilasId;
    const fragmento = plantillaPokemon.content.cloneNode(true);

    const campos = [
      { clave: 'mote', valor: datos.mote ?? '' },
      { clave: 'nivel', valor: datos.nivel ?? '' },
      { clave: 'estado', valor: datos.estado ?? 'Campeón' },
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
    campoFecha.value = partidaEditada.fechaVictoria;
    campoTiempo.value = partidaEditada.tiempoJuego;
    campoLicencia.value = partidaEditada.licenciaEntrenador;
    campoLeyendas.checked = Boolean(partidaEditada.huboLeyendasCaidas);
    actualizarCampoCondicional(campoLeyendas.checked);
    if (campoLeyendas.checked) {
      campoMencion.value = partidaEditada.mencionHonor || '';
    }

    const equipoGuardado =
      Array.isArray(partidaEditada.equipo) && partidaEditada.equipo.length > 0
        ? partidaEditada.equipo
        : [{}];
    for (const miembro of equipoGuardado.slice(0, MAX_POKEMON_EQUIPO)) {
      anadirFilaPokemon(miembro);
    }
  } else {
    actualizarCampoCondicional(false);
    anadirFilaPokemon();
  }

  // Campo condicional: mostrar y activar mención de honor al marcar la casilla
  campoLeyendas.addEventListener('change', () => {
    actualizarCampoCondicional(campoLeyendas.checked);
  });

  // Botón añadir fila del grupo dinámico
  if (btnAnadirPokemon) {
    btnAnadirPokemon.addEventListener('click', () => {
      anadirFilaPokemon();
    });
  }

  // Delegación de eventos en `#lista-equipo` para quitar una fila (Requisito 20)
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

  let procesandoEnvio = false;

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (procesandoEnvio) return;

    const { valido, primerError } = validador.validarFormulario();
    if (!valido) {
      lanzarAviso(formulario, 'Revisa los campos marcados en rojo antes de guardar', 'warning');
      if (primerError) primerError.focus();
      return;
    }

    procesandoEnvio = true;
    if (btnGuardar) {
      btnGuardar.disabled = true;
    }

    try {
      // Requisito 17: lectura con FormData (`get` y `getAll` para el grupo dinámico)
      const datosFormulario = new FormData(formulario);
      const motes = datosFormulario.getAll('pokemonMote');
      const niveles = datosFormulario.getAll('pokemonNivel');
      const estados = datosFormulario.getAll('pokemonEstado');
      const movimientos = datosFormulario.getAll('pokemonMovimiento');

      const equipo = motes.map((mote, indice) => ({
        mote: String(mote),
        nivel: Number(niveles[indice]),
        estado: String(estados[indice]),
        movimientoClave: String(movimientos[indice]),
      }));

      const registro = {
        codigoRegistro: String(datosFormulario.get('codigoRegistro') || ''),
        titulo: String(datosFormulario.get('titulo') || ''),
        edicion: String(datosFormulario.get('edicion') || ''),
        fechaVictoria: String(datosFormulario.get('fechaVictoria') || ''),
        tiempoJuego: String(datosFormulario.get('tiempoJuego') || ''),
        licenciaEntrenador: String(datosFormulario.get('licenciaEntrenador') || ''),
        huboLeyendasCaidas: datosFormulario.get('huboLeyendasCaidas') !== null,
        mencionHonor: String(datosFormulario.get('mencionHonor') || ''),
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
