/**
 * Controlador de la zona de administración de entrenadores (`usuarios.html`).
 * Solo accesible para usuarios con rol `'administrador'`.
 *
 * Elementos HTML requeridos:
 * - `#cabecera-principal`, `#zona-avisos`
 * - `#buscador-usuarios`, `#contador-usuarios`
 * - `#tabla-usuarios-contenedor`, `#lista-usuarios`, `#estado-vacio-usuarios`, `#paginacion-usuarios`
 * - `#plantilla-usuario`
 *
 * @module paginas/usuarios
 */

import { protegerPagina, renderizarCabecera } from '../componentes/cabecera.js';
import { inicializarAvisos, lanzarAviso } from '../avisos.js';
import { obtenerUsuarios, cambiarRolUsuario } from '../datos/usuarios.js';
import { filtrarLista, paginar } from '../paginacion.js';
import {
  leerPaginaDeUrl,
  actualizarPaginaEnUrl,
  renderizarPaginacion,
  vincularPaginacion,
} from '../componentes/paginacion.js';

export const POR_PAGINA_USUARIOS = 8;
export const RETARDO_BUSQUEDA_USUARIOS_MS = 250;

/**
 * Crea una fila de usuario clonando `<template id="plantilla-usuario">` con `textContent` y atributos.
 * @param {HTMLTemplateElement} plantilla
 * @param {import('../datos/usuarios.js').Usuario} usuario
 * @param {{nombreUsuario: string, rol: string}} sesion
 * @param {number} indiceFila
 * @returns {DocumentFragment}
 */
function crearFilaUsuario(plantilla, usuario, sesion, indiceFila) {
  const fragmento = plantilla.content.cloneNode(true);
  const esAdmin = usuario.rol === 'administrador';
  const esPropio = usuario.nombreUsuario.toLowerCase() === sesion.nombreUsuario.toLowerCase();

  const nodoNombre = fragmento.querySelector('[data-campo="nombreUsuario"]');
  if (nodoNombre) nodoNombre.textContent = usuario.nombreUsuario;

  const etiquetaTu = fragmento.querySelector('[data-campo="etiquetaTu"]');
  if (etiquetaTu) etiquetaTu.hidden = !esPropio;

  const nodoEmail = fragmento.querySelector('[data-campo="email"]');
  if (nodoEmail) nodoEmail.textContent = usuario.email;

  const nodoRol = fragmento.querySelector('[data-campo="rol"]');
  if (nodoRol) {
    nodoRol.textContent = esAdmin ? 'Administrador' : 'Usuario';
    nodoRol.className = esAdmin ? 'badge bg-warning text-dark' : 'badge bg-secondary';
  }

  const botonRol = fragmento.querySelector('[data-accion="cambiar-rol"]');
  const avisoPropio = fragmento.querySelector('[data-campo="avisoPropio"]');

  if (botonRol) {
    botonRol.dataset.usuario = usuario.nombreUsuario;
    botonRol.dataset.rolActual = usuario.rol;
    botonRol.textContent = esAdmin ? 'Quitar administrador' : 'Hacer administrador';
    botonRol.className = esAdmin
      ? 'btn btn-outline-danger btn-sm'
      : 'btn btn-outline-primary btn-sm';

    if (esPropio) {
      const idAviso = `aviso-propio-${indiceFila}`;
      const motivo = 'No puedes quitarte tu propio rol de administrador';
      botonRol.disabled = true;
      botonRol.title = motivo;
      botonRol.setAttribute('aria-describedby', idAviso);
      if (avisoPropio) {
        avisoPropio.id = idAviso;
        avisoPropio.textContent = motivo;
        avisoPropio.hidden = false;
      }
    }
  }

  return fragmento;
}

/**
 * Inicializa la zona de administración de usuarios con búsqueda, paginación y cambio de roles.
 * @param {Object} [deps={}]
 * @param {Document} [deps.doc=document]
 * @param {Storage} [deps.almacenUsuarios=localStorage]
 * @param {Storage} [deps.almacenSesion=sessionStorage]
 * @param {Location} [deps.localizacion=window.location]
 * @param {History} [deps.historial=window.history]
 * @param {number} [deps.porPagina=POR_PAGINA_USUARIOS]
 * @param {number} [deps.retardoBusqueda=RETARDO_BUSQUEDA_USUARIOS_MS]
 * @fires CustomEvent#aviso
 */
export function iniciarUsuarios({
  doc = document,
  almacenUsuarios = localStorage,
  almacenSesion = sessionStorage,
  localizacion = window.location,
  historial = window.history,
  porPagina = POR_PAGINA_USUARIOS,
  retardoBusqueda = RETARDO_BUSQUEDA_USUARIOS_MS,
} = {}) {
  inicializarAvisos(doc);

  // Protección estricta: solo administradores (Requisito 7 y 18)
  const sesion = protegerPagina({ soloAdmin: true, almacen: almacenSesion, localizacion });
  if (!sesion) return;

  renderizarCabecera(
    doc.getElementById('cabecera-principal'),
    sesion,
    'usuarios.html',
    almacenSesion,
    localizacion,
  );

  const cuerpoTabla = doc.getElementById('lista-usuarios');
  const tablaContenedor = doc.getElementById('tabla-usuarios-contenedor');
  const plantilla = doc.getElementById('plantilla-usuario');
  const buscador = doc.getElementById('buscador-usuarios');
  const contador = doc.getElementById('contador-usuarios');
  const estadoVacio = doc.getElementById('estado-vacio-usuarios');
  const paginacionContenedor = doc.getElementById('paginacion-usuarios');

  if (!cuerpoTabla || !plantilla) return;

  let paginaActual = leerPaginaDeUrl(localizacion.search);
  let consultaActual = '';
  let temporizadorBusqueda = null;

  /**
   * Lee los usuarios, filtra, pagina y sustituye las filas del cuerpo de tabla de una sola vez.
   */
  function renderizar() {
    const todos = obtenerUsuarios(almacenUsuarios);
    const filtrados = filtrarLista(
      todos,
      consultaActual,
      (usuario) => `${usuario.nombreUsuario} ${usuario.email} ${usuario.rol}`,
    );
    const resultado = paginar(filtrados, paginaActual, porPagina);

    paginaActual = resultado.pagina;
    actualizarPaginaEnUrl(paginaActual, historial, localizacion);

    const fragmento = doc.createDocumentFragment();
    resultado.elementos.forEach((usuario, indice) => {
      fragmento.append(crearFilaUsuario(plantilla, usuario, sesion, indice + 1));
    });
    cuerpoTabla.replaceChildren(fragmento);

    if (contador) {
      if (resultado.totalElementos === 0) {
        contador.textContent = '0 entrenadores encontrados';
      } else if (resultado.totalElementos === 1) {
        contador.textContent = '1 entrenador encontrado';
      } else {
        contador.textContent = `Mostrando ${resultado.elementos.length} de ${resultado.totalElementos} entrenadores`;
      }
    }

    const sinResultados = resultado.totalElementos === 0;
    if (tablaContenedor) tablaContenedor.hidden = sinResultados;
    if (estadoVacio) estadoVacio.hidden = !sinResultados;

    if (paginacionContenedor) {
      if (!sinResultados) {
        paginacionContenedor.hidden = false;
        renderizarPaginacion(paginacionContenedor, resultado, doc);
      } else {
        paginacionContenedor.hidden = true;
        paginacionContenedor.replaceChildren();
      }
    }
  }

  // Buscador con debounce (vuelve a la página 1)
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

  // Delegación en controles de paginación
  if (paginacionContenedor) {
    vincularPaginacion(paginacionContenedor, (nuevaPagina) => {
      paginaActual = nuevaPagina;
      renderizar();
    });
  }

  // Delegación de eventos en el listado de usuarios para cambiar el rol (Requisito 18 y 20)
  cuerpoTabla.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion="cambiar-rol"]');
    if (!boton || boton.disabled) return;

    const nombreObjetivo = boton.dataset.usuario;
    if (!nombreObjetivo) return;

    if (nombreObjetivo.toLowerCase() === sesion.nombreUsuario.toLowerCase()) {
      lanzarAviso(cuerpoTabla, 'No puedes quitarte tu propio rol de administrador', 'warning');
      return;
    }

    const rolActual = boton.dataset.rolActual;
    const nuevoRol = rolActual === 'administrador' ? 'usuario' : 'administrador';

    try {
      cambiarRolUsuario(nombreObjetivo, nuevoRol, almacenUsuarios);
      renderizar();
      const mensaje =
        nuevoRol === 'administrador'
          ? `${nombreObjetivo} ahora tiene permisos de administrador`
          : `Se han retirado los permisos de administrador a ${nombreObjetivo}`;
      lanzarAviso(cuerpoTabla, mensaje, 'success');
    } catch {
      lanzarAviso(cuerpoTabla, 'No se pudo actualizar el rol del entrenador', 'danger');
    }
  });

  renderizar();
}
