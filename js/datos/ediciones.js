/**
 * Catálogo de carátulas locales para cada edición oficial de Pokémon.
 * Las imágenes se sirven en local desde `img/caratulas/` (sin llamadas remotas).
 * @module datos/ediciones
 */

/**
 * Mapa de nombre oficial de edición -> ruta local de su carátula.
 * @type {Readonly<Record<string, string>>}
 */
export const CARATULAS_EDICIONES = Object.freeze({
  'Rojo Fuego': 'img/caratulas/rojo-fuego.png',
  'Verde Hoja': 'img/caratulas/verde-hoja.png',
  Esmeralda: 'img/caratulas/esmeralda.jpg',
  Diamante: 'img/caratulas/diamante.png',
  Perla: 'img/caratulas/perla.png',
  Platino: 'img/caratulas/platino.png',
  HeartGold: 'img/caratulas/heartgold.png',
  SoulSilver: 'img/caratulas/soulsilver.png',
  Negro: 'img/caratulas/negro.png',
  Blanco: 'img/caratulas/blanco.png',
  'Negro 2': 'img/caratulas/negro-2.png',
  'Blanco 2': 'img/caratulas/blanco-2.png',
  X: 'img/caratulas/x.png',
  Y: 'img/caratulas/y.png',
  'Rubí Omega': 'img/caratulas/rubi-omega.png',
  'Zafiro Alfa': 'img/caratulas/zafiro-alfa.png',
  Sol: 'img/caratulas/sol.png',
  Luna: 'img/caratulas/luna.png',
  Espada: 'img/caratulas/espada.png',
  Escudo: 'img/caratulas/escudo.png',
  'Leyendas: Arceus': 'img/caratulas/leyendas-arceus.png',
  Escarlata: 'img/caratulas/escarlata.png',
  Púrpura: 'img/caratulas/purpura.png',
  'Leyendas: Z-A': 'img/caratulas/leyendas-za.png',
});

/**
 * Devuelve la ruta local de la carátula correspondiente a una edición oficial.
 * @param {string} edicion
 * @returns {string} Ruta de la imagen o logo por defecto si no coincide.
 */
export function obtenerCaratulaEdicion(edicion) {
  if (edicion && Object.hasOwn(CARATULAS_EDICIONES, edicion)) {
    return CARATULAS_EDICIONES[edicion];
  }
  return 'img/logo.png';
}
