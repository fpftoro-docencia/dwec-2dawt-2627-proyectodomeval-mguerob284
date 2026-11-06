/**
 * Módulo de validadores puros y expresiones regulares.
 * Funciones puras independientes del DOM (fáciles de testear con Vitest).
 * @module validadores
 */

/**
 * Validador de nombre de usuario: 3 a 15 caracteres alfanuméricos y guion bajo.
 * @param {string} valor
 * @returns {{valido: boolean, motivo?: string}}
 */
export function validarNombreUsuario(valor) {
  if (!valor || typeof valor !== 'string') {
    return { valido: false, motivo: 'El nombre de usuario es obligatorio.' };
  }
  const limpio = valor.trim();
  if (limpio.length < 3) {
    return { valido: false, motivo: 'Debe tener al menos 3 caracteres.' };
  }
  if (limpio.length > 15) {
    return { valido: false, motivo: 'No puede superar los 15 caracteres.' };
  }
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(limpio)) {
    return {
      valido: false,
      motivo: 'Solo puede contener letras, números y guiones bajos (_).'
    };
  }
  return { valido: true };
}

/**
 * Valida formato de correo electrónico.
 * @param {string} email
 * @returns {{valido: boolean, motivo?: string}}
 */
export function validarEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valido: false, motivo: 'El correo electrónico es obligatorio.' };
  }
  const limpio = email.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(limpio)) {
    return { valido: false, motivo: 'El formato de correo no es válido.' };
  }
  return { valido: true };
}

/**
 * Analiza el cumplimiento individual de los requisitos de una contraseña.
 * Utiliza propiedades Unicode \p{Ll} y \p{Lu} como exige el contrato (Requisito 5).
 * @param {string} clave
 * @returns {{
 *   longitud: boolean,
 *   minuscula: boolean,
 *   mayuscula: boolean,
 *   cifra: boolean,
 *   esValida: boolean
 * }}
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
    esValida: longitud && minuscula && mayuscula && cifra
  };
}

/**
 * Valida la contraseña completa.
 * @param {string} clave
 * @returns {{valido: boolean, motivo?: string}}
 */
export function validarClave(clave) {
  const analisis = analizarRequisitosClave(clave);
  if (!analisis.esValida) {
    return {
      valido: false,
      motivo:
        'La contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula y un número.'
    };
  }
  return { valido: true };
}

/**
 * Valida que la repetición de la contraseña coincida.
 * @param {string} clave
 * @param {string} repeticion
 * @returns {{valido: boolean, motivo?: string}}
 */
export function validarRepeticionClave(clave, repeticion) {
  if (!repeticion) {
    return { valido: false, motivo: 'Debes repetir la contraseña.' };
  }
  if (clave !== repeticion) {
    return { valido: false, motivo: 'Las contraseñas no coinciden.' };
  }
  return { valido: true };
}
