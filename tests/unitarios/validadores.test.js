import { describe, it, expect } from 'vitest';
import {
  validarNombreUsuario,
  validarEmail,
  analizarRequisitosClave,
  validarClave,
  validarRepeticionClave,
} from '../../js/validadores.js';

describe('Validador de nombre de usuario (validarNombreUsuario)', () => {
  // Casos válidos con límites (3 y 15 caracteres)
  it.each([
    ['Ash', true],
    ['Red_123', true],
    ['abcdefghijklmno', true], // 15 caracteres (límite superior)
    ['abc', true], // 3 caracteres (límite inferior)
  ])('acepta nombre válido: «%s»', (nombre, esperado) => {
    expect(validarNombreUsuario(nombre).valido).toBe(esperado);
  });

  // Casos no válidos por cada regla con su motivo
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
    // Solo minúsculas y corta
    expect(analizarRequisitosClave('abc')).toEqual({
      longitud: false,
      minuscula: true,
      mayuscula: false,
      cifra: false,
      esValida: false,
    });

    // Cumple los 4 requisitos con propiedades Unicode \p{Ll} y \p{Lu}
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
    ['Éxito1234', true], // Prueba con tildes / caracteres Unicode
  ])('valida contraseñas robustas: «%s»', (clave, esperado) => {
    expect(validarClave(clave).valido).toBe(esperado);
  });

  it.each([
    ['Corta1A', false], // menos de 8
    ['solominusculas1', false], // sin mayúscula
    ['SOLOMAYUSCULAS1', false], // sin minúscula
    ['SinNumeroAqui', false], // sin cifra
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
