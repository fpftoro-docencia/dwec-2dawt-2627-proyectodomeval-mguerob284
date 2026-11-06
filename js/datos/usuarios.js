/**
 * Módulo de almacenamiento y gestión de usuarios en el navegador.
 * @module datos/usuarios
 */

const CLAVE_USUARIOS = 'pokememories_usuarios';

/**
 * @typedef {Object} Usuario
 * @property {string} nombreUsuario
 * @property {string} email
 * @property {string} resumenClave - Hash SHA-256 en hexadecimal.
 * @property {'usuario'|'administrador'} rol
 * @property {string} fechaRegistro - ISO string.
 */

/**
 * Obtiene la lista de todos los usuarios registrados.
 * A prueba de fallos: devuelve un array vacío si no hay datos o están dañados.
 * @param {Storage|{getItem: Function}} [almacen=localStorage]
 * @returns {Usuario[]}
 */
export function obtenerUsuarios(almacen = localStorage) {
  try {
    const raw = almacen.getItem(CLAVE_USUARIOS);
    if (!raw) return [];
    const datos = JSON.parse(raw);
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

/**
 * Guarda la lista de usuarios en el almacenamiento.
 * @param {Usuario[]} usuarios
 * @param {Storage|{setItem: Function}} [almacen=localStorage]
 */
export function guardarUsuarios(usuarios, almacen = localStorage) {
  almacen.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

/**
 * Busca un usuario por su nombre de usuario (sin distinguir mayúsculas ni minúsculas).
 * @param {string} nombreUsuario
 * @param {Storage|{getItem: Function}} [almacen=localStorage]
 * @returns {Usuario|null}
 */
export function buscarUsuario(nombreUsuario, almacen = localStorage) {
  if (!nombreUsuario) return null;
  const usuarios = obtenerUsuarios(almacen);
  const normalizado = nombreUsuario.trim().toLowerCase();
  return (
    usuarios.find(
      (u) => u.nombreUsuario && u.nombreUsuario.toLowerCase() === normalizado
    ) || null
  );
}

/**
 * Comprueba si un nombre de usuario ya está registrado.
 * @param {string} nombreUsuario
 * @param {Storage|{getItem: Function}} [almacen=localStorage]
 * @returns {boolean}
 */
export function existeUsuario(nombreUsuario, almacen = localStorage) {
  return buscarUsuario(nombreUsuario, almacen) !== null;
}

/**
 * Registra un nuevo usuario en el sistema.
 * El primer usuario registrado recibe el rol de 'administrador'.
 * Los siguientes se registran como 'usuario'.
 * @param {Object} datos
 * @param {string} datos.nombreUsuario
 * @param {string} datos.email
 * @param {string} datos.resumenClave
 * @param {Storage|{getItem: Function, setItem: Function}} [almacen=localStorage]
 * @returns {Usuario}
 * @throws {Error} Si el nombre de usuario ya existe o faltan datos obligatorios.
 */
export function registrarUsuario(
  { nombreUsuario, email, resumenClave },
  almacen = localStorage
) {
  if (!nombreUsuario || !email || !resumenClave) {
    throw new Error('Faltan campos obligatorios para registrar el usuario');
  }

  const usuarios = obtenerUsuarios(almacen);
  if (existeUsuario(nombreUsuario, almacen)) {
    throw new Error('El nombre de usuario ya está registrado');
  }

  // El primer usuario registrado es administrador (Requisito 4)
  const rol = usuarios.length === 0 ? 'administrador' : 'usuario';

  /** @type {Usuario} */
  const nuevoUsuario = {
    nombreUsuario: nombreUsuario.trim(),
    email: email.trim().toLowerCase(),
    resumenClave,
    rol,
    fechaRegistro: new Date().toISOString()
  };

  usuarios.push(nuevoUsuario);
  guardarUsuarios(usuarios, almacen);

  return nuevoUsuario;
}

/**
 * Verifica las credenciales de inicio de sesión.
 * @param {string} nombreUsuario
 * @param {string} resumenClave
 * @param {Storage|{getItem: Function}} [almacen=localStorage]
 * @returns {Usuario|null} Devuelve el usuario si coincide, o null en caso contrario.
 */
export function verificarCredenciales(
  nombreUsuario,
  resumenClave,
  almacen = localStorage
) {
  const usuario = buscarUsuario(nombreUsuario, almacen);
  if (!usuario) return null;
  if (usuario.resumenClave === resumenClave) {
    return usuario;
  }
  return null;
}

/**
 * Actualiza el rol de un usuario existente.
 * @param {string} nombreUsuario
 * @param {'usuario'|'administrador'} nuevoRol
 * @param {Storage|{getItem: Function, setItem: Function}} [almacen=localStorage]
 * @returns {Usuario}
 */
export function cambiarRolUsuario(
  nombreUsuario,
  nuevoRol,
  almacen = localStorage
) {
  const usuarios = obtenerUsuarios(almacen);
  const normalizado = nombreUsuario.trim().toLowerCase();
  const usuario = usuarios.find(
    (u) => u.nombreUsuario.toLowerCase() === normalizado
  );

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  usuario.rol = nuevoRol;
  guardarUsuarios(usuarios, almacen);
  return usuario;
}
