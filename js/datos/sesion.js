/**
 * Módulo de gestión de la sesión activa en el navegador.
 * @module datos/sesion
 */

const CLAVE_SESION = 'pokememories_sesion';

/**
 * Guarda la sesión del usuario actual en sessionStorage.
 * @param {{nombreUsuario: string, rol: 'usuario'|'administrador'}} sesion
 * @param {Storage|{setItem: Function}} [almacen=sessionStorage]
 */
export function guardarSesion(sesion, almacen = sessionStorage) {
  almacen.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

/**
 * Obtiene la sesión actual. Devuelve null si no existe o si los datos están corruptos.
 * @param {Storage|{getItem: Function}} [almacen=sessionStorage]
 * @returns {{nombreUsuario: string, rol: 'usuario'|'administrador'}|null}
 */
export function obtenerSesion(almacen = sessionStorage) {
  try {
    const raw = almacen.getItem(CLAVE_SESION);
    if (!raw) return null;
    const parseado = JSON.parse(raw);
    if (
      typeof parseado === 'object' &&
      parseado !== null &&
      typeof parseado.nombreUsuario === 'string' &&
      (parseado.rol === 'usuario' || parseado.rol === 'administrador')
    ) {
      return parseado;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cierra la sesión activa eliminando sus datos del almacenamiento.
 * @param {Storage|{removeItem: Function}} [almacen=sessionStorage]
 */
export function cerrarSesion(almacen = sessionStorage) {
  try {
    almacen.removeItem(CLAVE_SESION);
  } catch {
    // Si falla el almacenamiento, se ignora
  }
}

/**
 * Comprueba si existe una sesión activa válida.
 * @param {Storage|{getItem: Function}} [almacen=sessionStorage]
 * @returns {boolean}
 */
export function haySesion(almacen = sessionStorage) {
  return obtenerSesion(almacen) !== null;
}
