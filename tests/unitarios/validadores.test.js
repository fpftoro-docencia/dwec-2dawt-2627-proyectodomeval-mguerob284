import { describe, it, expect } from 'vitest';
import {
  obtenerFechaHoyIso,
  validarNombreUsuario,
  validarEmail,
  analizarRequisitosClave,
  validarClave,
  validarRepeticionClave,
  validarCodigoRegistro,
  validarNumeroRegistro,
  validarTituloPartida,
  validarEdicion,
  validarFechaVictoria,
  validarTiempoJuego,
  validarIdEntrenador,
  validarTipoPartida,
  validarModalidadesLocke,
  validarMencionHonor,
  validarMotePokemon,
  validarNivelPokemon,
  validarEstadoPokemon,
  validarMovimientoClave,
  validarEquipoPokemon,
  validarLeyendasCaidas,
  validadores,
} from '../../js/validadores.js';

describe('Validador de nombre de usuario (validarNombreUsuario)', () => {
  it.each([
    ['Ash', true],
    ['Red_123', true],
    ['abcdefghijklmno', true], // 15 caracteres (límite superior)
    ['abc', true], // 3 caracteres (límite inferior)
  ])('acepta nombre válido: «%s»', (nombre, esperado) => {
    expect(validarNombreUsuario(nombre).valido).toBe(esperado);
  });

  it.each([
    ['', 'El nombre de usuario es obligatorio'],
    ['ab', 'Debe tener al menos 3 caracteres'],
    ['nombreDemasiadoLargoQueSuperaQuince', 'No puede superar los 15 caracteres'],
    ['ash ketchum', 'Solo puede contener letras, números y guiones bajos (_)'],
    ['pikachu@pkm', 'Solo puede contener letras, números y guiones bajos (_)'],
  ])('rechaza «%s» con motivo: %s', (nombre, motivoEsperado) => {
    const resultado = validarNombreUsuario(nombre);
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toBe(motivoEsperado);
  });
});

describe('Validador de correo electrónico (validarEmail)', () => {
  it.each([
    ['entrenador@liga.pkm', true],
    ['ash.ketchum@pueblo-paleta.org', true],
    ['user123@sub.dominio.es', true],
  ])('acepta email válido: «%s»', (email, esperado) => {
    expect(validarEmail(email).valido).toBe(esperado);
  });

  it.each([
    ['', 'El correo electrónico es obligatorio'],
    ['correoSinArroba.com', 'El formato de correo no es válido'],
    ['sinDominio@', 'El formato de correo no es válido'],
    ['@sinUsuario.com', 'El formato de correo no es válido'],
  ])('rechaza «%s» con motivo: %s', (email, motivoEsperado) => {
    const resultado = validarEmail(email);
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toBe(motivoEsperado);
  });
});

describe('Requisitos de contraseña y propiedades Unicode (analizarRequisitosClave)', () => {
  it('detecta correctamente cada uno de los cuatro requisitos', () => {
    expect(analizarRequisitosClave('abc')).toEqual({
      longitud: false,
      minuscula: true,
      mayuscula: false,
      cifra: false,
      esValida: false,
    });

    expect(analizarRequisitosClave('Pikachu9')).toEqual({
      longitud: true,
      minuscula: true,
      mayuscula: true,
      cifra: true,
      esValida: true,
    });
  });

  it.each([
    ['Pikachu_2026', true],
    ['Contrasena1', true],
    ['Éxito1234', true],
  ])('valida contraseñas robustas: «%s»', (clave, esperado) => {
    expect(validarClave(clave).valido).toBe(esperado);
  });

  it.each([
    ['Corta1A', false],
    ['solominusculas1', false],
    ['SOLOMAYUSCULAS1', false],
    ['SinNumeroAqui', false],
  ])('rechaza contraseña débil: «%s»', (clave, esperado) => {
    expect(validarClave(clave).valido).toBe(esperado);
  });
});

describe('Validador de repetición de contraseña (validarRepeticionClave)', () => {
  it('acepta cuando coinciden exactamente', () => {
    expect(validarRepeticionClave('Pikachu9', 'Pikachu9').valido).toBe(true);
  });

  it('rechaza si está vacía o son distintas', () => {
    expect(validarRepeticionClave('Pikachu9', '').valido).toBe(false);
    expect(validarRepeticionClave('Pikachu9', 'pikachu9').valido).toBe(false);
  });
});

describe('Validadores de RegistroPartida (Sprint 2 · Requisito 13)', () => {
  describe('Código de registro (validarCodigoRegistro)', () => {
    it.each([
      ['POKE-HGD-0042', true],
      ['POKE-ESM-0001', true],
      ['POKE-PLT-9999', true],
    ])('acepta código válido: «%s»', (codigo, esperado) => {
      expect(validarCodigoRegistro(codigo).valido).toBe(esperado);
    });

    it.each([
      ['', 'El código de registro es obligatorio'],
      [
        'poke-hgd-0042',
        'Formato inválido: usa POKE- seguido de 3 letras mayúsculas y 4 dígitos (ej. POKE-HGD-0042)',
      ],
      [
        'POKE-HG-0042',
        'Formato inválido: usa POKE- seguido de 3 letras mayúsculas y 4 dígitos (ej. POKE-HGD-0042)',
      ],
      [
        'POKE-HGD-42',
        'Formato inválido: usa POKE- seguido de 3 letras mayúsculas y 4 dígitos (ej. POKE-HGD-0042)',
      ],
      [
        'PKMN-HGD-0042',
        'Formato inválido: usa POKE- seguido de 3 letras mayúsculas y 4 dígitos (ej. POKE-HGD-0042)',
      ],
    ])('rechaza «%s» con motivo esperado', (codigo, motivoEsperado) => {
      const resultado = validarCodigoRegistro(codigo);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });

    it.each([
      ['1', true],
      ['001', true],
      ['0042', true],
      ['9999', true],
    ])('acepta parte numérica válida: «%s»', (numero, esperado) => {
      expect(validarNumeroRegistro(numero).valido).toBe(esperado);
    });

    it.each([
      ['', 'Escribe un número de registro (ej. 001 o 42)'],
      ['12345', 'Introduce solo entre 1 y 4 dígitos (ej. 001 o 0042)'],
      ['12a', 'Introduce solo entre 1 y 4 dígitos (ej. 001 o 0042)'],
    ])('rechaza parte numérica inválida «%s»', (numero, motivoEsperado) => {
      const resultado = validarNumeroRegistro(numero);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });
  });

  describe('Título de la partida (validarTituloPartida)', () => {
    it.each([
      ['Run', true], // 3 caracteres (límite inferior)
      ['Nuzlocke Johto sin curas', true],
      ['a'.repeat(40), true], // 40 caracteres (límite superior)
    ])('acepta título válido: «%s»', (titulo, esperado) => {
      expect(validarTituloPartida(titulo).valido).toBe(esperado);
    });

    it.each([
      ['', 'El título de la partida es obligatorio'],
      ['ab', 'El título debe tener entre 3 y 40 caracteres'],
      ['a'.repeat(41), 'El título debe tener entre 3 y 40 caracteres'],
    ])('rechaza título inválido «%s»', (titulo, motivoEsperado) => {
      const resultado = validarTituloPartida(titulo);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });
  });

  describe('Edición del juego (validarEdicion)', () => {
    it.each([
      ['HeartGold', true],
      ['Esmeralda', true],
      ['Leyendas: Arceus', true],
      ['Leyendas: Z-A', true],
    ])('acepta edición oficial: «%s»', (edicion, esperado) => {
      expect(validarEdicion(edicion).valido).toBe(esperado);
    });

    it.each([
      ['', 'Selecciona una edición oficial de la lista'],
      ['Pokémon Inventado', 'Selecciona una edición oficial de la lista'],
    ])('rechaza edición no válida «%s»', (edicion, motivoEsperado) => {
      const resultado = validarEdicion(edicion);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });
  });

  describe('Fecha de victoria (validarFechaVictoria)', () => {
    const referencia = new Date(2026, 10, 17); // 2026-11-17

    it('formatea correctamente la fecha local ISO', () => {
      expect(obtenerFechaHoyIso(referencia)).toBe('2026-11-17');
    });

    it.each([
      ['2026-11-17', true], // hoy (límite superior)
      ['2024-02-29', true], // año bisiesto real
      ['2010-03-26', true],
    ])('acepta fecha válida: «%s»', (fecha, esperado) => {
      expect(validarFechaVictoria(fecha, referencia).valido).toBe(esperado);
    });

    it.each([
      ['', 'La fecha de victoria es obligatoria'],
      ['17-11-2026', 'Introduce una fecha válida en formato AAAA-MM-DD'],
      ['2026-02-31', 'La fecha indicada no existe en el calendario'],
      ['2026-11-18', 'La fecha de victoria no puede estar en el futuro'],
    ])('rechaza fecha inválida «%s»', (fecha, motivoEsperado) => {
      const resultado = validarFechaVictoria(fecha, referencia);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });
  });

  describe('Tiempo de juego (validarTiempoJuego)', () => {
    it.each([
      ['0:05', true],
      ['45:30', true],
      ['999:59', true], // límite superior
    ])('acepta tiempo válido: «%s»', (tiempo, esperado) => {
      expect(validarTiempoJuego(tiempo).valido).toBe(esperado);
    });

    it.each([
      ['', 'El tiempo de juego es obligatorio'],
      ['45:60', 'Introduce el tiempo en formato Horas:Minutos (ej. 45:30)'],
      ['45:5', 'Introduce el tiempo en formato Horas:Minutos (ej. 45:30)'],
      ['1000:00', 'Introduce el tiempo en formato Horas:Minutos (ej. 45:30)'],
      ['cuarenta', 'Introduce el tiempo en formato Horas:Minutos (ej. 45:30)'],
    ])('rechaza tiempo inválido «%s»', (tiempo, motivoEsperado) => {
      const resultado = validarTiempoJuego(tiempo);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });
  });

  describe('ID de Entrenador con dígito de control módulo 10 (validarIdEntrenador)', () => {
    it.each([
      ['00151-7', true], // 0+0+1+5+1 = 7
      ['12345-5', true], // 1+2+3+4+5 = 15 -> 5
      ['00000-0', true], // límite inferior
      ['99999-5', true], // 45 -> 5 (límite superior)
    ])('acepta ID de Entrenador válido: «%s»', (idEntrenador, esperado) => {
      expect(validarIdEntrenador(idEntrenador).valido).toBe(esperado);
    });

    it.each([
      ['', 'El ID de Entrenador es obligatorio'],
      ['1234-0', 'Formato inválido: usa 5 dígitos, guion y dígito de control (ej. 00151-7)'],
      ['123456-1', 'Formato inválido: usa 5 dígitos, guion y dígito de control (ej. 00151-7)'],
      ['001517', 'Formato inválido: usa 5 dígitos, guion y dígito de control (ej. 00151-7)'],
      ['00151-A', 'Formato inválido: usa 5 dígitos, guion y dígito de control (ej. 00151-7)'],
      ['00151-8', 'El dígito de control del ID de Entrenador no es correcto'],
      ['12345-0', 'El dígito de control del ID de Entrenador no es correcto'],
    ])('rechaza ID de Entrenador inválido «%s»', (idEntrenador, motivoEsperado) => {
      const resultado = validarIdEntrenador(idEntrenador);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });
  });

  describe('Mención de honor condicional (validarMencionHonor)', () => {
    it.each([
      ['1234567890', true], // 10 caracteres (límite inferior)
      ['Pidgeot resistió un golpe crítico en la Calle Victoria para salvar al equipo', true],
      ['a'.repeat(120), true], // 120 caracteres (límite superior)
    ])('acepta mención válida', (mencion, esperado) => {
      expect(validarMencionHonor(mencion).valido).toBe(esperado);
    });

    it.each([
      ['', 'Explica la hazaña de tu héroe caído (entre 10 y 120 caracteres)'],
      ['Muy corta', 'Explica la hazaña de tu héroe caído (entre 10 y 120 caracteres)'],
      ['a'.repeat(121), 'Explica la hazaña de tu héroe caído (entre 10 y 120 caracteres)'],
    ])('rechaza mención inválida', (mencion, motivoEsperado) => {
      const resultado = validarMencionHonor(mencion);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });
  });

  describe('Miembros y equipo Pokémon (1 a 6)', () => {
    it.each([
      ['Pi', true],
      ['Typhlosion', true],
      ['a'.repeat(20), true],
    ])('acepta mote válido: «%s»', (mote, esperado) => {
      expect(validarMotePokemon(mote).valido).toBe(esperado);
    });

    it.each([
      ['', 'El mote o especie del Pokémon es obligatorio'],
      ['A', 'El mote del Pokémon debe tener entre 2 y 20 caracteres'],
      ['a'.repeat(21), 'El mote del Pokémon debe tener entre 2 y 20 caracteres'],
    ])('rechaza mote inválido «%s»', (mote, motivoEsperado) => {
      expect(validarMotePokemon(mote)).toEqual({ valido: false, motivo: motivoEsperado });
    });

    it.each([
      [1, true],
      ['50', true],
      [100, true],
    ])('acepta nivel válido: %s', (nivel, esperado) => {
      expect(validarNivelPokemon(nivel).valido).toBe(esperado);
    });

    it.each([
      ['', 'El nivel del Pokémon es obligatorio'],
      [0, 'El nivel debe ser un número entero entre 1 y 100'],
      [101, 'El nivel debe ser un número entero entre 1 y 100'],
      ['50.5', 'El nivel debe ser un número entero entre 1 y 100'],
    ])('rechaza nivel inválido: %s', (nivel, motivoEsperado) => {
      expect(validarNivelPokemon(nivel)).toEqual({ valido: false, motivo: motivoEsperado });
    });

    it('valida estado y movimiento clave', () => {
      expect(validarEstadoPokemon('Campeón').valido).toBe(true);
      expect(validarEstadoPokemon('Leyenda Caída').valido).toBe(true);
      expect(validarEstadoPokemon('Debilitado').valido).toBe(false);

      expect(validarMovimientoClave('Rayo').valido).toBe(true);
      expect(validarMovimientoClave('').valido).toBe(false);
      expect(validarMovimientoClave('X').valido).toBe(false);
    });

    it('valida tamaño del equipo (mínimo 1, máximo 6) y contenido de cada miembro', () => {
      const miembroValido = {
        mote: 'Garchomp',
        nivel: 62,
        estado: 'Campeón',
        movimientoClave: 'Terremoto',
      };

      expect(validarEquipoPokemon([]).valido).toBe(false);
      expect(validarEquipoPokemon([miembroValido]).valido).toBe(true);
      expect(validarEquipoPokemon(Array(6).fill(miembroValido)).valido).toBe(true);
      expect(validarEquipoPokemon(Array(7).fill(miembroValido)).valido).toBe(false);
      expect(validarEquipoPokemon([null]).valido).toBe(false);
      expect(validarEquipoPokemon([{ ...miembroValido, nivel: 150 }]).valido).toBe(false);
    });

    it('valida el grupo condicional de leyendas caídas (1 a 6 Pokémon caídos)', () => {
      const leyendaValida = {
        mote: 'Ampharos',
        nivel: 58,
        hazana: 'Cayó contra Lance salvando el combate final',
      };

      expect(validarLeyendasCaidas([]).valido).toBe(false);
      expect(validarLeyendasCaidas([leyendaValida]).valido).toBe(true);
      expect(validarLeyendasCaidas(Array(6).fill(leyendaValida)).valido).toBe(true);
      expect(validarLeyendasCaidas(Array(7).fill(leyendaValida)).valido).toBe(false);
      expect(validarLeyendasCaidas([null]).valido).toBe(false);
      expect(validarLeyendasCaidas([{ ...leyendaValida, hazana: 'corta' }]).valido).toBe(false);
    });

    it('valida tipo de partida (Clásica o Locke) y modalidades Locke combinables', () => {
      expect(validarTipoPartida('Clásica').valido).toBe(true);
      expect(validarTipoPartida('Locke').valido).toBe(true);
      expect(validarTipoPartida('Otra').valido).toBe(false);
      expect(validarTipoPartida('').valido).toBe(false);

      expect(validarModalidadesLocke(['Nuzlocke']).valido).toBe(true);
      expect(validarModalidadesLocke(['Nuzlocke', 'Randomlocke', 'Hardlocke']).valido).toBe(true);
      expect(validarModalidadesLocke(['Vidalocke']).valido).toBe(true);
      expect(validarModalidadesLocke([]).valido).toBe(false);
      expect(validarModalidadesLocke(['InventadoLocke']).valido).toBe(false);
    });
  });

  describe('Mapa unificado de validadores (data-validar)', () => {
    it('expone las estrategias de validación por clave', () => {
      expect(validadores.codigoRegistro('POKE-HGD-0001').valido).toBe(true);
      expect(validadores.idEntrenador('00151-7').valido).toBe(true);
      expect(validadores.tiempoJuego('12:30').valido).toBe(true);
    });
  });
});
