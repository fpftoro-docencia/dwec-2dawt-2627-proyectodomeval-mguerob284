import { describe, it, expect } from 'vitest';
import { normalizarTextoBusqueda, filtrarLista, paginar } from '../../js/paginacion.js';

describe('Función pura de paginación (paginar)', () => {
  const elementos = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];

  it('devuelve correctamente la primera y la última página', () => {
    expect(paginar(elementos, 1, 3)).toEqual({
      elementos: ['p1', 'p2', 'p3'],
      pagina: 1,
      totalPaginas: 3,
      totalElementos: 7,
    });

    expect(paginar(elementos, 3, 3)).toEqual({
      elementos: ['p7'],
      pagina: 3,
      totalPaginas: 3,
      totalElementos: 7,
    });
  });

  it('corrige una página que no existe a la más cercana que sí existe', () => {
    expect(paginar(elementos, 99, 3)).toEqual({
      elementos: ['p7'],
      pagina: 3,
      totalPaginas: 3,
      totalElementos: 7,
    });

    expect(paginar(elementos, 0, 3)).toEqual({
      elementos: ['p1', 'p2', 'p3'],
      pagina: 1,
      totalPaginas: 3,
      totalElementos: 7,
    });

    expect(paginar(elementos, -5, 3).pagina).toBe(1);
    expect(paginar(elementos, 'abc', 3).pagina).toBe(1);
  });

  it('maneja una lista vacía o entradas no válidas sin fallar', () => {
    expect(paginar([], 1, 6)).toEqual({
      elementos: [],
      pagina: 1,
      totalPaginas: 1,
      totalElementos: 0,
    });

    expect(paginar([], 4, 6)).toEqual({
      elementos: [],
      pagina: 1,
      totalPaginas: 1,
      totalElementos: 0,
    });

    expect(paginar(null, 1, 0)).toEqual({
      elementos: [],
      pagina: 1,
      totalPaginas: 1,
      totalElementos: 0,
    });
  });
});

describe('Normalización y filtrado sin tildes ni mayúsculas', () => {
  it('normaliza mayúsculas, espacios y tildes', () => {
    expect(normalizarTextoBusqueda('  Árbol Pokémon Épico  ')).toBe('arbol pokemon epico');
    expect(normalizarTextoBusqueda(null)).toBe('');
  });

  it('filtra ignorando mayúsculas y tildes', () => {
    const registros = [
      { titulo: 'Rubí Omega Nuzlocke' },
      { titulo: 'Platino Sinnoh' },
      { titulo: 'Púrpura Escarlata' },
    ];

    expect(filtrarLista(registros, 'rubi', (r) => r.titulo)).toHaveLength(1);
    expect(filtrarLista(registros, 'PURPURA', (r) => r.titulo)).toHaveLength(1);
    expect(filtrarLista(registros, '   ', (r) => r.titulo)).toHaveLength(3);
    expect(filtrarLista(null, 'rubi', (r) => r.titulo)).toEqual([]);
  });
});
