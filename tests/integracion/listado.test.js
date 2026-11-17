import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { guardarSesion } from '../../js/datos/sesion.js';
import { crearPartida } from '../../js/datos/partidas.js';
import { iniciarListado } from '../../js/paginas/listado.js';

function crearPartidaDemo(numero, extra = {}) {
  return {
    codigoRegistro: `POKE-HGD-${String(numero).padStart(4, '0')}`,
    titulo: `Aventura Pokémon ${numero}`,
    edicion: 'HeartGold',
    fechaVictoria: '2026-10-10',
    tiempoJuego: '42:15',
    licenciaEntrenador: '12345678Z',
    huboLeyendasCaidas: false,
    leyendasCaidas: [],
    equipo: [{ mote: 'Typhlosion', nivel: 60, movimientoClave: 'Lanzallamas' }],
    ...extra,
  };
}

describe('Integración: Listado de recuerdos (listado.html)', () => {
  let almacenPartidas;
  let almacenSesion;
  let localizacion;
  let historial;

  beforeEach(() => {
    vi.useFakeTimers();
    cargarPagina('listado.html');
    almacenPartidas = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    guardarSesion({ nombreUsuario: 'AshKetchum', rol: 'usuario' }, almacenSesion);

    localizacion = {
      pathname: '/listado.html',
      search: '',
      hash: '',
      replace: vi.fn(),
    };
    historial = {
      replaceState: vi.fn((...argumentos) => {
        const [, query = ''] = String(argumentos[2]).split('?');
        localizacion.search = query ? `?${query}` : '';
      }),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filtra con debounce sin distinguir mayúsculas ni tildes y vuelve a la página 1', () => {
    crearPartida(
      'AshKetchum',
      crearPartidaDemo(1, { titulo: 'Rubí Omega Épico' }),
      almacenPartidas,
    );
    crearPartida('AshKetchum', crearPartidaDemo(2, { titulo: 'Platino Sinnoh' }), almacenPartidas);
    crearPartida('AshKetchum', crearPartidaDemo(3, { titulo: 'Esmeralda Hoenn' }), almacenPartidas);

    iniciarListado({
      doc: document,
      almacenPartidas,
      almacenSesion,
      localizacion,
      historial,
      porPagina: 2,
      retardoBusqueda: 250,
    });

    // Avanzar a la página 2 antes de buscar
    const botonSiguiente = document.querySelector('button[aria-label="Página siguiente"]');
    botonSiguiente.click();
    expect(localizacion.search).toBe('?pagina=2');

    // Escribir en el buscador (sin tilde y en minúsculas)
    const buscador = document.getElementById('buscador-partidas');
    escribir(buscador, 'rubi epico');

    // Antes del debounce todavía no se ha filtrado
    expect(document.querySelectorAll('#lista-partidas article')).toHaveLength(1);
    expect(localizacion.search).toBe('?pagina=2');

    // Al cumplirse el debounce, filtra y vuelve a la página 1
    vi.advanceTimersByTime(250);

    const tarjetas = document.querySelectorAll('#lista-partidas article');
    expect(tarjetas).toHaveLength(1);
    expect(tarjetas[0].textContent).toContain('Rubí Omega Épico');
    expect(document.getElementById('contador-resultados').textContent).toBe(
      '1 recuerdo encontrado',
    );
    expect(localizacion.search).toBe('');
  });

  it('cambia de página actualizando la URL y marca la página activa con aria-current', () => {
    for (let i = 1; i <= 5; i += 1) {
      crearPartida('AshKetchum', crearPartidaDemo(i), almacenPartidas);
    }

    iniciarListado({
      doc: document,
      almacenPartidas,
      almacenSesion,
      localizacion,
      historial,
      porPagina: 2,
    });

    expect(document.querySelectorAll('#lista-partidas article')).toHaveLength(2);
    expect(document.querySelector('button[aria-current="page"]').textContent).toBe('1');
    expect(document.querySelector('button[aria-label="Página anterior"]').disabled).toBe(true);

    const botonPagina2 = document.querySelector('button[data-pagina="2"]');
    botonPagina2.click();

    expect(historial.replaceState).toHaveBeenCalledWith(null, '', '/listado.html?pagina=2');
    expect(document.querySelector('button[aria-current="page"]').textContent).toBe('2');
    expect(document.querySelector('button[aria-label="Página anterior"]').disabled).toBe(false);
  });

  it('permite borrar un recuerdo pidiendo confirmación en <dialog>', () => {
    crearPartida('AshKetchum', crearPartidaDemo(1, { titulo: 'Johto Final' }), almacenPartidas);

    iniciarListado({
      doc: document,
      almacenPartidas,
      almacenSesion,
      localizacion,
      historial,
      porPagina: 6,
    });

    const botonBorrar = document.querySelector('button[data-accion="borrar"]');
    botonBorrar.click();

    expect(document.getElementById('dialogo-borrar-nombre').textContent).toBe('Johto Final');

    document.getElementById('btn-confirmar-borrado').click();

    expect(document.querySelectorAll('#lista-partidas article')).toHaveLength(0);
    expect(document.getElementById('estado-vacio').hidden).toBe(false);
    expect(document.getElementById('zona-avisos').textContent).toContain(
      'Recuerdo borrado correctamente',
    );
  });
});
