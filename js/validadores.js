/**
 * Módulo de validadores puros y expresiones regulares de PokeMemories.
 * Funciones puras independientes del DOM (fáciles de testear con Vitest).
 * @module validadores
 */

/**
 * @typedef {Object} ResultadoValidacion
 * @property {boolean} valido - Si el dato cumple la regla de validación.
 * @property {string} [motivo] - Mensaje explicativo cuando el dato no es válido.
 */

/**
 * Ediciones oficiales de juegos Pokémon admitidas en PokeMemories.
 * @type {string[]}
 */
export const EDICIONES_OFICIALES = Object.freeze([
  'Rojo Fuego',
  'Verde Hoja',
  'Esmeralda',
  'Diamante',
  'Perla',
  'Platino',
  'HeartGold',
  'SoulSilver',
  'Negro',
  'Blanco',
  'Negro 2',
  'Blanco 2',
  'X',
  'Y',
  'Rubí Omega',
  'Zafiro Alfa',
  'Sol',
  'Luna',
  'Espada',
  'Escudo',
  'Leyendas: Arceus',
  'Escarlata',
  'Púrpura',
  'Leyendas: Z-A',
]);

/**
 * Tipos de partida permitidos (mutuamente excluyentes: Clásica o Locke).
 * @type {string[]}
 */
export const TIPOS_PARTIDA = Object.freeze(['Clásica', 'Locke']);

/**
 * Modalidades combinables disponibles cuando la partida es de tipo Locke.
 * @type {string[]}
 */
export const MODALIDADES_LOCKE = Object.freeze([
  'Nuzlocke',
  'Randomlocke',
  'Vidalocke',
  'Hardlocke',
]);

/**
 * Estados permitidos para cada Pokémon dentro del equipo de una partida.
 * @type {string[]}
 */
export const ESTADOS_POKEMON = Object.freeze(['Campeón', 'Leyenda Caída']);

/**
 * Devuelve una fecha en formato ISO local (YYYY-MM-DD) sin desfase horario UTC.
 * @param {Date} [fecha=new Date()] - Fecha de referencia.
 * @returns {string}
 * @example
 * obtenerFechaHoyIso(new Date(2026, 10, 17)); // '2026-11-17'
 */
export function obtenerFechaHoyIso(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Validador de nombre de usuario: 3 a 15 caracteres alfanuméricos y guion bajo.
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarNombreUsuario('AshKetchum'); // { valido: true }
 */
export function validarNombreUsuario(valor) {
  if (!valor || typeof valor !== 'string') {
    return { valido: false, motivo: 'El nombre de usuario es obligatorio' };
  }
  const limpio = valor.trim();
  if (limpio.length < 3) {
    return { valido: false, motivo: 'Debe tener al menos 3 caracteres' };
  }
  if (limpio.length > 15) {
    return { valido: false, motivo: 'No puede superar los 15 caracteres' };
  }
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(limpio)) {
    return {
      valido: false,
      motivo: 'Solo puede contener letras, números y guiones bajos (_)',
    };
  }
  return { valido: true };
}

/**
 * Valida formato de correo electrónico.
 * @param {string} email
 * @returns {ResultadoValidacion}
 * @example
 * validarEmail('ash@liga.pkm'); // { valido: true }
 */
export function validarEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valido: false, motivo: 'El correo electrónico es obligatorio' };
  }
  const limpio = email.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(limpio)) {
    return { valido: false, motivo: 'El formato de correo no es válido' };
  }
  return { valido: true };
}

/**
 * Analiza el cumplimiento individual de los requisitos de una contraseña.
 * Utiliza propiedades Unicode \p{Ll} y \p{Lu} como exige el contrato (Requisito 5).
 * @param {string} [clave='']
 * @returns {{
 *   longitud: boolean,
 *   minuscula: boolean,
 *   mayuscula: boolean,
 *   cifra: boolean,
 *   esValida: boolean
 * }}
 * @example
 * analizarRequisitosClave('Pikachu9').esValida; // true
 */
export function analizarRequisitosClave(clave = '') {
  const longitud = typeof clave === 'string' && clave.length >= 8;
  const minuscula = /\p{Ll}/u.test(clave);
  const mayuscula = /\p{Lu}/u.test(clave);
  const cifra = /\d/.test(clave);

  return {
    longitud,
    minuscula,
    mayuscula,
    cifra,
    esValida: longitud && minuscula && mayuscula && cifra,
  };
}

/**
 * Valida la contraseña completa.
 * @param {string} clave
 * @returns {ResultadoValidacion}
 * @example
 * validarClave('Pikachu9'); // { valido: true }
 */
export function validarClave(clave) {
  const analisis = analizarRequisitosClave(clave);
  if (!analisis.esValida) {
    return {
      valido: false,
      motivo:
        'La contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula y un número',
    };
  }
  return { valido: true };
}

/**
 * Valida que la repetición de la contraseña coincida.
 * @param {string} clave
 * @param {string} repeticion
 * @returns {ResultadoValidacion}
 * @example
 * validarRepeticionClave('Pikachu9', 'Pikachu9'); // { valido: true }
 */
export function validarRepeticionClave(clave, repeticion) {
  if (!repeticion) {
    return { valido: false, motivo: 'Debes repetir la contraseña' };
  }
  if (clave !== repeticion) {
    return { valido: false, motivo: 'Las contraseñas no coinciden' };
  }
  return { valido: true };
}

/**
 * Valida el código de registro de una partida (formato POKE-XXX-0000).
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarCodigoRegistro('POKE-HGD-0042'); // { valido: true }
 */
export function validarCodigoRegistro(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, motivo: 'El código de registro es obligatorio' };
  }
  const limpio = valor.trim();
  const regex = /^POKE-[A-Z]{3}-\d{4}$/;
  if (!regex.test(limpio)) {
    return {
      valido: false,
      motivo:
        'Formato inválido: usa POKE- seguido de 3 letras mayúsculas y 4 dígitos (ej. POKE-HGD-0042)',
    };
  }
  return { valido: true };
}

/**
 * Valida la parte numérica que escribe el usuario para el código de registro (1 a 4 dígitos).
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarNumeroRegistro('001'); // { valido: true }
 */
export function validarNumeroRegistro(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, motivo: 'Escribe un número de registro (ej. 001 o 42)' };
  }
  const limpio = valor.trim();
  if (!/^\d{1,4}$/.test(limpio)) {
    return { valido: false, motivo: 'Introduce solo entre 1 y 4 dígitos (ej. 001 o 0042)' };
  }
  return { valido: true };
}

/**
 * Valida el título de una partida (3 a 40 caracteres).
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarTituloPartida('Nuzlocke Johto'); // { valido: true }
 */
export function validarTituloPartida(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, motivo: 'El título de la partida es obligatorio' };
  }
  const limpio = valor.trim();
  if (limpio.length < 3 || limpio.length > 40) {
    return { valido: false, motivo: 'El título debe tener entre 3 y 40 caracteres' };
  }
  return { valido: true };
}

/**
 * Valida que la edición elegida pertenezca a la lista de ediciones oficiales.
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarEdicion('HeartGold'); // { valido: true }
 */
export function validarEdicion(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, motivo: 'Selecciona una edición oficial de la lista' };
  }
  if (!EDICIONES_OFICIALES.includes(valor.trim())) {
    return { valido: false, motivo: 'Selecciona una edición oficial de la lista' };
  }
  return { valido: true };
}

/**
 * Valida la fecha de victoria: formato YYYY-MM-DD real y no posterior a la fecha actual.
 * @param {string} valor
 * @param {Date} [fechaReferencia=new Date()] - Fecha de referencia para pruebas deterministas.
 * @returns {ResultadoValidacion}
 * @example
 * validarFechaVictoria('2026-10-01', new Date(2026, 10, 17)); // { valido: true }
 */
export function validarFechaVictoria(valor, fechaReferencia = new Date()) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, motivo: 'La fecha de victoria es obligatoria' };
  }
  const limpio = valor.trim();
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpio);
  if (!coincidencia) {
    return { valido: false, motivo: 'Introduce una fecha válida en formato AAAA-MM-DD' };
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fechaComprobada = new Date(anio, mes - 1, dia);

  const esFechaReal =
    fechaComprobada.getFullYear() === anio &&
    fechaComprobada.getMonth() === mes - 1 &&
    fechaComprobada.getDate() === dia;

  if (!esFechaReal) {
    return { valido: false, motivo: 'La fecha indicada no existe en el calendario' };
  }

  const hoyIso = obtenerFechaHoyIso(fechaReferencia);
  if (limpio > hoyIso) {
    return { valido: false, motivo: 'La fecha de victoria no puede estar en el futuro' };
  }

  return { valido: true };
}

/**
 * Valida el tiempo de juego en formato Horas:Minutos (ej. 45:30 o 120:05).
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarTiempoJuego('45:30'); // { valido: true }
 */
export function validarTiempoJuego(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, motivo: 'El tiempo de juego es obligatorio' };
  }
  const limpio = valor.trim();
  const regex = /^\d{1,3}:[0-5]\d$/;
  if (!regex.test(limpio)) {
    return {
      valido: false,
      motivo: 'Introduce el tiempo en formato Horas:Minutos (ej. 45:30)',
    };
  }
  return { valido: true };
}

/**
 * Valida el ID de Entrenador con formato `00000-0` (5 dígitos y dígito de control módulo 10).
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarIdEntrenador('00151-7'); // { valido: true }
 */
export function validarIdEntrenador(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, motivo: 'El ID de Entrenador es obligatorio' };
  }
  const limpio = valor.trim();
  const coincidencia = /^(\d{5})-(\d)$/.exec(limpio);

  if (!coincidencia) {
    return {
      valido: false,
      motivo: 'Formato inválido: usa 5 dígitos, guion y dígito de control (ej. 00151-7)',
    };
  }

  const digitos = coincidencia[1];
  const controlIndicado = Number(coincidencia[2]);
  const suma = Array.from(digitos).reduce((acumulado, cifra) => acumulado + Number(cifra), 0);
  const controlEsperado = suma % 10;

  if (controlIndicado !== controlEsperado) {
    return {
      valido: false,
      motivo: 'El dígito de control del ID de Entrenador no es correcto',
    };
  }

  return { valido: true };
}

/**
 * Valida la mención de honor para las Leyendas Caídas (campo condicional, 10 a 120 caracteres).
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarMencionHonor('Pidgeot cayó protegiendo al equipo en la Calle Victoria'); // { valido: true }
 */
export function validarMencionHonor(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return {
      valido: false,
      motivo: 'Explica la hazaña de tu héroe caído (entre 10 y 120 caracteres)',
    };
  }
  const limpio = valor.trim();
  if (limpio.length < 10 || limpio.length > 120) {
    return {
      valido: false,
      motivo: 'Explica la hazaña de tu héroe caído (entre 10 y 120 caracteres)',
    };
  }
  return { valido: true };
}

/**
 * Valida el mote o especie de un Pokémon del equipo (2 a 20 caracteres).
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarMotePokemon('Typhlosion'); // { valido: true }
 */
export function validarMotePokemon(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, motivo: 'El mote o especie del Pokémon es obligatorio' };
  }
  const limpio = valor.trim();
  if (limpio.length < 2 || limpio.length > 20) {
    return { valido: false, motivo: 'El mote del Pokémon debe tener entre 2 y 20 caracteres' };
  }
  return { valido: true };
}

/**
 * Valida el nivel de un Pokémon del equipo (número entero entre 1 y 100).
 * @param {string|number} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarNivelPokemon(68); // { valido: true }
 */
export function validarNivelPokemon(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return { valido: false, motivo: 'El nivel del Pokémon es obligatorio' };
  }
  const texto = String(valor).trim();
  if (!/^\d+$/.test(texto)) {
    return { valido: false, motivo: 'El nivel debe ser un número entero entre 1 y 100' };
  }
  const nivel = Number(texto);
  if (nivel < 1 || nivel > 100) {
    return { valido: false, motivo: 'El nivel debe ser un número entero entre 1 y 100' };
  }
  return { valido: true };
}

/**
 * Valida el estado de un Pokémon en la partida ('Campeón' o 'Leyenda Caída').
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarEstadoPokemon('Campeón'); // { valido: true }
 */
export function validarEstadoPokemon(valor) {
  if (!valor || typeof valor !== 'string' || !ESTADOS_POKEMON.includes(valor.trim())) {
    return { valido: false, motivo: 'Selecciona un estado válido para el Pokémon' };
  }
  return { valido: true };
}

/**
 * Valida el movimiento clave de un Pokémon del equipo (2 a 30 caracteres).
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarMovimientoClave('Lanzallamas'); // { valido: true }
 */
export function validarMovimientoClave(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, motivo: 'El movimiento clave es obligatorio' };
  }
  const limpio = valor.trim();
  if (limpio.length < 2 || limpio.length > 30) {
    return { valido: false, motivo: 'El movimiento clave debe tener entre 2 y 30 caracteres' };
  }
  return { valido: true };
}

/**
 * Valida la estructura completa de un equipo Pokémon (de 1 a 6 miembros válidos).
 * @param {Array<Object>} equipo
 * @returns {ResultadoValidacion}
 * @example
 * validarEquipoPokemon([{ mote: 'Pikachu', nivel: 55, movimientoClave: 'Rayo' }]);
 */
export function validarEquipoPokemon(equipo) {
  if (!Array.isArray(equipo) || equipo.length < 1 || equipo.length > 6) {
    return { valido: false, motivo: 'Debes registrar entre 1 y 6 Pokémon en el equipo' };
  }

  for (const miembro of equipo) {
    if (!miembro || typeof miembro !== 'object') {
      return { valido: false, motivo: 'Hay un Pokémon con datos incompletos en el equipo' };
    }
    const comprobaciones = [
      validarMotePokemon(miembro.mote),
      validarNivelPokemon(miembro.nivel),
      validarMovimientoClave(miembro.movimientoClave),
    ];
    if (miembro.estado !== undefined) {
      comprobaciones.push(validarEstadoPokemon(miembro.estado));
    }
    const fallo = comprobaciones.find((resultado) => !resultado.valido);
    if (fallo) {
      return fallo;
    }
  }

  return { valido: true };
}

/**
 * Valida la lista condicional de Leyendas Caídas (de 1 a 6 Pokémon caídos válidos).
 * @param {Array<Object>} leyendas
 * @returns {ResultadoValidacion}
 * @example
 * validarLeyendasCaidas([{ mote: 'Pidgeot', nivel: 48, hazana: 'Cayó protegiendo al equipo en la Calle Victoria' }]);
 */
export function validarLeyendasCaidas(leyendas) {
  if (!Array.isArray(leyendas) || leyendas.length < 1 || leyendas.length > 6) {
    return { valido: false, motivo: 'Debes registrar entre 1 y 6 leyendas caídas' };
  }

  for (const leyenda of leyendas) {
    if (!leyenda || typeof leyenda !== 'object') {
      return { valido: false, motivo: 'Hay una leyenda caída con datos incompletos' };
    }
    const comprobaciones = [
      validarMotePokemon(leyenda.mote),
      validarNivelPokemon(leyenda.nivel),
      validarMencionHonor(leyenda.hazana),
    ];
    const fallo = comprobaciones.find((resultado) => !resultado.valido);
    if (fallo) {
      return fallo;
    }
  }

  return { valido: true };
}

/**
 * Valida el tipo de partida ('Clásica' o 'Locke').
 * @param {string} valor
 * @returns {ResultadoValidacion}
 * @example
 * validarTipoPartida('Locke'); // { valido: true }
 */
export function validarTipoPartida(valor) {
  if (!valor || typeof valor !== 'string' || !TIPOS_PARTIDA.includes(valor.trim())) {
    return { valido: false, motivo: 'Selecciona si la partida es Clásica o Locke' };
  }
  return { valido: true };
}

/**
 * Valida las modalidades elegidas para una partida tipo Locke (al menos una modalidad oficial).
 * @param {string[]} modalidades
 * @returns {ResultadoValidacion}
 * @example
 * validarModalidadesLocke(['Nuzlocke', 'Hardlocke']); // { valido: true }
 */
export function validarModalidadesLocke(modalidades) {
  if (!Array.isArray(modalidades) || modalidades.length === 0) {
    return { valido: false, motivo: 'Selecciona al menos una modalidad de Locke' };
  }
  const todasValidas = modalidades.every((mod) => MODALIDADES_LOCKE.includes(String(mod).trim()));
  if (!todasValidas) {
    return { valido: false, motivo: 'Alguna modalidad de Locke seleccionada no es válida' };
  }
  return { valido: true };
}

/**
 * Mapa centralizado de validadores de formato (patrón Estrategia) seleccionables por `data-validar`.
 * @type {Object.<string, Function>}
 */
export const validadores = {
  nombreUsuario: validarNombreUsuario,
  email: validarEmail,
  clave: validarClave,
  codigoRegistro: validarCodigoRegistro,
  numeroRegistro: validarNumeroRegistro,
  titulo: validarTituloPartida,
  edicion: validarEdicion,
  fechaVictoria: validarFechaVictoria,
  tiempoJuego: validarTiempoJuego,
  idEntrenador: validarIdEntrenador,
  tipoPartida: validarTipoPartida,
  mencionHonor: validarMencionHonor,
  motePokemon: validarMotePokemon,
  nivelPokemon: validarNivelPokemon,
  estadoPokemon: validarEstadoPokemon,
  movimientoClave: validarMovimientoClave,
};
