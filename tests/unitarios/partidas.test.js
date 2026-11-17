import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerClavePartidas,
  normalizarPartida,
  obtenerPartidas,
  crearPartida,
  buscarPartidaPorId,
  actualizarPartida,
  eliminarPartida,
} from '../../js/datos/partidas.js';

const PARTIDA_BASE = {
  codigoRegistro: ' poke-hgd-0042 ',
  titulo: '  Liga Johto Nuzlocke  ',
  edicion: 'HeartGold',
  fechaVictoria: '2026-10-15',
  tiempoJuego: '48:25',
  idEntrenador: ' 00151-7 ',
  huboLeyendasCaidas: true,
  leyendasCaidas: [
    {
      mote: '  Ampharos  ',
      nivel: '58',
      hazana: '  Cayó contra Lance salvando el combate final  ',
    },
  ],
  equipo: [{ mote: 'Typhlosion', nivel: '65', movimientoClave: 'Estallido' }],
};

describe('Módulo de datos: Partidas (localStorage por usuario)', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('construye una clave única e independiente para cada usuario', () => {
    expect(obtenerClavePartidas('AshKetchum')).toBe('PokeMemories_partidas_ashketchum');
    expect(obtenerClavePartidas('  Misty  ')).toBe('PokeMemories_partidas_misty');
    expect(() => obtenerClavePartidas('')).toThrow();
  });

  it('normaliza campos y vacía las leyendas caídas cuando no hubo caídos', () => {
    const conLeyenda = normalizarPartida(PARTIDA_BASE);
    expect(conLeyenda.codigoRegistro).toBe('POKE-HGD-0042');
    expect(conLeyenda.idEntrenador).toBe('00151-7');
    expect(conLeyenda.titulo).toBe('Liga Johto Nuzlocke');
    expect(conLeyenda.equipo[0].nivel).toBe(65);
    expect(conLeyenda.leyendasCaidas).toEqual([
      {
        mote: 'Ampharos',
        nivel: 58,
        hazana: 'Cayó contra Lance salvando el combate final',
      },
    ]);

    const sinLeyenda = normalizarPartida({
      ...PARTIDA_BASE,
      huboLeyendasCaidas: false,
      leyendasCaidas: [{ mote: 'Pidgeot', nivel: 40, hazana: 'Debe ignorarse al desmarcar' }],
    });
    expect(sinLeyenda.huboLeyendasCaidas).toBe(false);
    expect(sinLeyenda.leyendasCaidas).toEqual([]);
  });

  it('crea, lee, busca, actualiza y elimina registros con id único', () => {
    const primera = crearPartida('AshKetchum', PARTIDA_BASE, almacen);
    const segunda = crearPartida(
      'AshKetchum',
      { ...PARTIDA_BASE, codigoRegistro: 'POKE-ESM-0007', titulo: 'Hoenn sin curas' },
      almacen,
    );

    expect(primera.id).toBeTruthy();
    expect(segunda.id).toBeTruthy();
    expect(primera.id).not.toBe(segunda.id);

    const lista = obtenerPartidas('AshKetchum', almacen);
    expect(lista).toHaveLength(2);
    expect(lista[0].id).toBe(segunda.id);

    const encontrada = buscarPartidaPorId('AshKetchum', primera.id, almacen);
    expect(encontrada?.codigoRegistro).toBe('POKE-HGD-0042');
    expect(buscarPartidaPorId('AshKetchum', 'no-existe', almacen)).toBeNull();

    const actualizada = actualizarPartida(
      'AshKetchum',
      primera.id,
      { ...PARTIDA_BASE, titulo: 'Johto Rematch' },
      almacen,
    );
    expect(actualizada?.titulo).toBe('Johto Rematch');
    expect(actualizada?.id).toBe(primera.id);
    expect(actualizarPartida('AshKetchum', 'inexistente', PARTIDA_BASE, almacen)).toBeNull();

    expect(eliminarPartida('AshKetchum', primera.id, almacen)).toBe(true);
    expect(eliminarPartida('AshKetchum', primera.id, almacen)).toBe(false);
    expect(obtenerPartidas('AshKetchum', almacen)).toHaveLength(1);
  });

  it('aísla por completo los registros de usuarios distintos', () => {
    crearPartida('AshKetchum', PARTIDA_BASE, almacen);
    crearPartida('Misty', { ...PARTIDA_BASE, titulo: 'Mono Agua Kanto' }, almacen);

    const deAsh = obtenerPartidas('AshKetchum', almacen);
    const deMisty = obtenerPartidas('Misty', almacen);

    expect(deAsh).toHaveLength(1);
    expect(deMisty).toHaveLength(1);
    expect(deAsh[0].titulo).toBe('Liga Johto Nuzlocke');
    expect(deMisty[0].titulo).toBe('Mono Agua Kanto');
  });

  it('no falla si lo guardado en localStorage está estropeado (Requisito 14)', () => {
    const clave = obtenerClavePartidas('AshKetchum');

    almacen.setItem(clave, '{ esto no es json válido');
    expect(obtenerPartidas('AshKetchum', almacen)).toEqual([]);

    almacen.setItem(clave, JSON.stringify({ noEsArray: true }));
    expect(obtenerPartidas('AshKetchum', almacen)).toEqual([]);

    almacen.setItem(clave, JSON.stringify([null, 'basura', { sinId: true }, { id: 'ok-1' }]));
    expect(obtenerPartidas('AshKetchum', almacen)).toEqual([{ id: 'ok-1' }]);
  });
});
