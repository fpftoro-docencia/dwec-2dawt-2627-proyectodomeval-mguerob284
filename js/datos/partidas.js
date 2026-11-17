/**
 * Módulo de almacenamiento y gestión de registros de partidas Pokémon en el navegador.
 * Cada entrenador guarda sus propios recuerdos bajo una clave dedicada en localStorage.
 * @module datos/partidas
 */

const PREFIJO_CLAVE_PARTIDAS = 'PokeMemories_partidas_';

/**
 * @typedef {Object} MiembroEquipo
 * @property {string} mote - Mote o especie del Pokémon campeón.
 * @property {number} nivel - Nivel final en la partida (1 a 100).
 * @property {string} movimientoClave - Movimiento insignia recordado.
 */

/**
 * @typedef {Object} LeyendaCaida
 * @property {string} mote - Mote o especie del Pokémon caído.
 * @property {number} nivel - Nivel que tenía al caer (1 a 100).
 * @property {string} hazana - Recuerdo o hazaña por la que sigue en el corazón del entrenador.
 */

/**
 * @typedef {Object} RegistroPartida
 * @property {string} id - Identificador único del registro.
 * @property {string} codigoRegistro - Código único con formato POKE-XXX-0000.
 * @property {string} titulo - Título o desafío de la partida.
 * @property {string} edicion - Edición oficial de Pokémon.
 * @property {string} fechaVictoria - Fecha de victoria en formato YYYY-MM-DD.
 * @property {string} tiempoJuego - Tiempo total en formato Horas:Minutos.
 * @property {string} idEntrenador - ID de Entrenador en formato 00000-0 con dígito de control.
 * @property {boolean} huboLeyendasCaidas - Indica si la partida incluye homenaje a caídos.
 * @property {LeyendaCaida[]} leyendasCaidas - Pokémon caídos en la aventura (vacío si no hubo).
 * @property {MiembroEquipo[]} equipo - Lista de 1 a 6 Pokémon campeones registrados.
 * @property {string} fechaCreacion - Marca de tiempo ISO de creación.
 * @property {string} fechaActualizacion - Marca de tiempo ISO de última edición.
 */

/**
 * Genera un identificador único para un registro de partida.
 * @returns {string}
 */
function generarIdPartida() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const tiempo = Date.now().toString(36);
  const aleatorio = Math.random().toString(36).slice(2, 10);
  return `partida-${tiempo}-${aleatorio}`;
}

/**
 * Calcula la clave de almacenamiento en localStorage perteneciente a un usuario concreto.
 * @param {string} nombreUsuario
 * @returns {string}
 * @throws {Error} Si no se proporciona un nombre de usuario válido.
 */
export function obtenerClavePartidas(nombreUsuario) {
  if (!nombreUsuario || typeof nombreUsuario !== 'string' || !nombreUsuario.trim()) {
    throw new Error('Se requiere un nombre de usuario para acceder a sus partidas');
  }
  return `${PREFIJO_CLAVE_PARTIDAS}${nombreUsuario.trim().toLowerCase()}`;
}

/**
 * Normaliza los datos de entrada de una partida antes de persistirlos.
 * @param {Partial<RegistroPartida>} datos
 * @returns {Omit<RegistroPartida, 'id'|'fechaCreacion'|'fechaActualizacion'>}
 */
export function normalizarPartida(datos = {}) {
  const huboLeyendasCaidas = Boolean(datos.huboLeyendasCaidas);
  const equipoEntrada = Array.isArray(datos.equipo) ? datos.equipo : [];
  const leyendasEntrada =
    huboLeyendasCaidas && Array.isArray(datos.leyendasCaidas) ? datos.leyendasCaidas : [];

  const equipo = equipoEntrada.map((miembro) => ({
    mote: String(miembro?.mote ?? '').trim(),
    nivel: Number(miembro?.nivel ?? 1),
    movimientoClave: String(miembro?.movimientoClave ?? '').trim(),
  }));

  const leyendasCaidas = leyendasEntrada.map((leyenda) => ({
    mote: String(leyenda?.mote ?? '').trim(),
    nivel: Number(leyenda?.nivel ?? 1),
    hazana: String(leyenda?.hazana ?? '').trim(),
  }));

  return {
    codigoRegistro: String(datos.codigoRegistro ?? '')
      .trim()
      .toUpperCase(),
    titulo: String(datos.titulo ?? '').trim(),
    edicion: String(datos.edicion ?? '').trim(),
    fechaVictoria: String(datos.fechaVictoria ?? '').trim(),
    tiempoJuego: String(datos.tiempoJuego ?? '').trim(),
    idEntrenador: String(datos.idEntrenador ?? datos.licenciaEntrenador ?? '').trim(),
    huboLeyendasCaidas,
    leyendasCaidas,
    equipo,
  };
}

/**
 * Lee todas las partidas guardadas de un usuario.
 * A prueba de fallos: devuelve un array vacío si faltan datos o el JSON está estropeado.
 * @param {string} nombreUsuario
 * @param {Storage|{getItem: Function}} [almacen=localStorage]
 * @returns {RegistroPartida[]}
 */
export function obtenerPartidas(nombreUsuario, almacen = localStorage) {
  try {
    const clave = obtenerClavePartidas(nombreUsuario);
    const raw = almacen.getItem(clave);
    if (!raw) return [];
    const datos = JSON.parse(raw);
    if (!Array.isArray(datos)) return [];
    return datos.filter(
      (item) => item !== null && typeof item === 'object' && typeof item.id === 'string',
    );
  } catch {
    return [];
  }
}

/**
 * Persiste la lista completa de partidas de un usuario en almacenamiento.
 * @param {string} nombreUsuario
 * @param {RegistroPartida[]} partidas
 * @param {Storage|{setItem: Function}} [almacen=localStorage]
 */
export function guardarPartidas(nombreUsuario, partidas, almacen = localStorage) {
  const clave = obtenerClavePartidas(nombreUsuario);
  almacen.setItem(clave, JSON.stringify(partidas));
}

/**
 * Busca una partida concreta del usuario por su identificador único.
 * @param {string} nombreUsuario
 * @param {string} id
 * @param {Storage|{getItem: Function}} [almacen=localStorage]
 * @returns {RegistroPartida|null}
 */
export function buscarPartidaPorId(nombreUsuario, id, almacen = localStorage) {
  if (!id) return null;
  const partidas = obtenerPartidas(nombreUsuario, almacen);
  return partidas.find((partida) => partida.id === id) || null;
}

/**
 * Crea un nuevo registro de partida para el usuario y lo guarda al principio del historial.
 * @param {string} nombreUsuario
 * @param {Partial<RegistroPartida>} datos
 * @param {Storage|{getItem: Function, setItem: Function}} [almacen=localStorage]
 * @returns {RegistroPartida}
 */
export function crearPartida(nombreUsuario, datos, almacen = localStorage) {
  const partidas = obtenerPartidas(nombreUsuario, almacen);
  const ahora = new Date().toISOString();

  /** @type {RegistroPartida} */
  const nuevaPartida = {
    id: generarIdPartida(),
    ...normalizarPartida(datos),
    fechaCreacion: ahora,
    fechaActualizacion: ahora,
  };

  guardarPartidas(nombreUsuario, [nuevaPartida, ...partidas], almacen);
  return nuevaPartida;
}

/**
 * Actualiza una partida existente del usuario manteniendo su id y fecha de creación.
 * @param {string} nombreUsuario
 * @param {string} id
 * @param {Partial<RegistroPartida>} datos
 * @param {Storage|{getItem: Function, setItem: Function}} [almacen=localStorage]
 * @returns {RegistroPartida|null} La partida actualizada o null si el id no existe.
 */
export function actualizarPartida(nombreUsuario, id, datos, almacen = localStorage) {
  const partidas = obtenerPartidas(nombreUsuario, almacen);
  const indice = partidas.findIndex((partida) => partida.id === id);

  if (indice === -1) {
    return null;
  }

  const existente = partidas[indice];
  /** @type {RegistroPartida} */
  const actualizada = {
    ...existente,
    ...normalizarPartida(datos),
    id: existente.id,
    fechaCreacion: existente.fechaCreacion,
    fechaActualizacion: new Date().toISOString(),
  };

  const copia = [...partidas];
  copia[indice] = actualizada;
  guardarPartidas(nombreUsuario, copia, almacen);
  return actualizada;
}

/**
 * Elimina una partida del usuario por su identificador.
 * @param {string} nombreUsuario
 * @param {string} id
 * @param {Storage|{getItem: Function, setItem: Function}} [almacen=localStorage]
 * @returns {boolean} True si se eliminó algún registro, false si no existía.
 */
export function eliminarPartida(nombreUsuario, id, almacen = localStorage) {
  const partidas = obtenerPartidas(nombreUsuario, almacen);
  const filtradas = partidas.filter((partida) => partida.id !== id);

  if (filtradas.length === partidas.length) {
    return false;
  }

  guardarPartidas(nombreUsuario, filtradas, almacen);
  return true;
}
