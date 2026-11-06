/**
 * Componente de cabecera y control de acceso a páginas privadas.
 * @module componentes/cabecera
 */

import { obtenerSesion, cerrarSesion } from '../datos/sesion.js';
import { guardarAvisoPendiente } from '../avisos.js';

/**
 * Comprueba el acceso a una página privada.
 * Redirige a index.html si no hay sesión, o a listado.html si no es administrador en páginas protegidas.
 * @param {Object} [opciones={}]
 * @param {boolean} [opciones.soloAdmin=false]
 * @param {Storage} [opciones.almacen=sessionStorage]
 * @param {Location} [opciones.localizacion=window.location]
 * @returns {{nombreUsuario: string, rol: 'usuario'|'administrador'}|null}
 */
export function protegerPagina({
  soloAdmin = false,
  almacen = sessionStorage,
  localizacion = window.location
} = {}) {
  const sesion = obtenerSesion(almacen);

  if (!sesion) {
    guardarAvisoPendiente('Debes iniciar sesión para acceder', 'warning');
    localizacion.replace('index.html');
    return null;
  }

  if (soloAdmin && sesion.rol !== 'administrador') {
    guardarAvisoPendiente(
      'Acceso denegado: solo administradores pueden ver esa página',
      'danger'
    );
    localizacion.replace('listado.html');
    return null;
  }

  return sesion;
}

/**
 * Renderiza la cabecera compartida para páginas privadas.
 * @param {HTMLElement} contenedor - Elemento donde insertar la cabecera (<header>).
 * @param {{nombreUsuario: string, rol: 'usuario'|'administrador'}} sesion
 * @param {string} paginaActual - Nombre del archivo actual (ej. 'listado.html').
 * @param {Storage} [almacen=sessionStorage]
 * @param {Location} [localizacion=window.location]
 */
export function renderizarCabecera(
  contenedor,
  sesion,
  paginaActual,
  almacen = sessionStorage,
  localizacion = window.location
) {
  if (!contenedor || !sesion) return;

  const esAdmin = sesion.rol === 'administrador';
  const rolBadge = esAdmin
    ? '<span class="badge bg-warning text-dark badge-role ms-1">Profesor (Admin)</span>'
    : '<span class="badge bg-secondary badge-role ms-1">Entrenador</span>';

  const menuAdmin = esAdmin
    ? `<li class="nav-item">
         <a class="nav-link ${paginaActual === 'usuarios.html' ? 'active font-weight-bold text-primary' : ''}" 
            href="usuarios.html" id="nav-usuarios">
           👥 Usuarios
         </a>
       </li>`
    : '';

  contenedor.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand navbar-brand-poke d-flex align-items-center gap-2" href="listado.html">
          <span>⚡ PokéMemories</span>
        </a>
        <div class="d-flex align-items-center">
          <ul class="navbar-nav flex-row gap-3 me-auto">
            <li class="nav-item">
              <a class="nav-link ${paginaActual === 'listado.html' ? 'active text-primary' : ''}" 
                 href="listado.html" id="nav-listado">
                🏆 Recuerdos
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${paginaActual === 'ficha.html' ? 'active text-primary' : ''}" 
                 href="ficha.html" id="nav-nueva-partida">
                ➕ Nueva Partida
              </a>
            </li>
            ${menuAdmin}
          </ul>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="navbar-text text-light small d-none d-md-inline" id="info-usuario-activo">
            👤 <strong>${sesion.nombreUsuario}</strong> ${rolBadge}
          </span>
          <button type="button" class="btn btn-outline-danger btn-sm" id="btn-cerrar-sesion">
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  `;

  const btnCerrar = contenedor.querySelector('#btn-cerrar-sesion');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      cerrarSesion(almacen);
      guardarAvisoPendiente('Sesión cerrada correctamente', 'info');
      localizacion.replace('index.html');
    });
  }
}
