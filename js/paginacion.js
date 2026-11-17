/**
 * Módulo puro de paginación y búsqueda sin distinción de mayúsculas ni tildes.
 * Sin dependencias del DOM para facilitar las pruebas unitarias y la cobertura.
 * @module paginacion
 */

/**
 * Normaliza un texto eliminando diacríticos/tildes, espacios extremos y pasando a minúsculas.
 * @param {string} [texto='']
 * @returns {string}
 * @example
 * normalizarTextoBusqueda('  Éxito Pokémon  '); // 'exito pokemon'
 */
export function normalizarTextoBusqueda(texto = '') {
  if (texto === null || texto === undefined) {
    return '';
  }
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtra una lista sin distinguir mayúsculas ni tildes mediante una función extractora de texto.
 * @template T
 * @param {T[]} lista - Colección original.
 * @param {string} consulta - Texto escrito por el usuario en el buscador.
 * @param {(elemento: T) => string} obtenerTexto - Función que concatena los campos buscables.
 * @returns {T[]}
 * @example
 * filtrarLista([{ nombre: 'Rubí' }], 'rubi', (x) => x.nombre); // [{ nombre: 'Rubí' }]
 */
export function filtrarLista(lista, consulta, obtenerTexto) {
  if (!Array.isArray(lista)) {
    return [];
  }
  const termino = normalizarTextoBusqueda(consulta);
  if (!termino) {
    return [...lista];
  }
  const palabras = termino.split(/\s+/);
  return lista.filter((elemento) => {
    const texto = normalizarTextoBusqueda(obtenerTexto(elemento));
    return palabras.every((palabra) => texto.includes(palabra));
  });
}

/**
 * Divide una lista en páginas, corrigiendo cualquier número de página fuera de rango.
 * @template T
 * @param {T[]} lista - Colección de elementos a paginar.
 * @param {number|string} [pagina=1] - Página solicitada (1-indexada).
 * @param {number} [porPagina=6] - Elementos máximos por página.
 * @returns {{
 *   elementos: T[],
 *   pagina: number,
 *   totalPaginas: number,
 *   totalElementos: number,
 * }}
 * @example
 * paginar(['a', 'b', 'c'], 2, 2); // { elementos: ['c'], pagina: 2, totalPaginas: 2, totalElementos: 3 }
 */
export function paginar(lista, pagina = 1, porPagina = 6) {
  const elementosValidos = Array.isArray(lista) ? lista : [];
  const tamano = Number.isInteger(porPagina) && porPagina > 0 ? porPagina : 1;
  const totalElementos = elementosValidos.length;
  const totalPaginas = Math.max(1, Math.ceil(totalElementos / tamano));

  const solicitada = Number.parseInt(String(pagina), 10);
  let paginaCorregida = Number.isNaN(solicitada) ? 1 : solicitada;

  if (paginaCorregida < 1) {
    paginaCorregida = 1;
  } else if (paginaCorregida > totalPaginas) {
    paginaCorregida = totalPaginas;
  }

  const inicio = (paginaCorregida - 1) * tamano;
  const elementos = elementosValidos.slice(inicio, inicio + tamano);

  return {
    elementos,
    pagina: paginaCorregida,
    totalPaginas,
    totalElementos,
  };
}
