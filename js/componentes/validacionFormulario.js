/**
 * Motor reutilizable de validación en tiempo real y accesible para los formularios de PokeMemories.
 *
 * Comportamiento (Requisitos 19 y 20):
 * - Escucha `blur` en la fase de **captura** del formulario para la primera validación de cada campo
 *   (ya que `blur` no burbujea).
 * - Una vez tocado un campo, lo revalida con cada `input` o `change`.
 * - Revalida campos dependientes cuando cambia otro campo (ej. repetir contraseña).
 * - Usa `setCustomValidity` y `validity`, seleccionando el validador por `data-validar`.
 * - Gestiona `is-invalid`, `aria-invalid`, `aria-describedby` y el mensaje en su caja de error.
 *
 * @module componentes/validacionFormulario
 */

import { validadores } from '../validadores.js';

/**
 * Localiza la caja de error asociada a un campo (`data-error-id`, `aria-describedby` o `#error-<id>`).
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} campo
 * @param {Document} doc
 * @returns {HTMLElement|null}
 */
function obtenerCajaError(campo, doc) {
  if (campo.dataset.errorId) {
    return doc.getElementById(campo.dataset.errorId);
  }
  const descritoPor = campo.getAttribute('aria-describedby') || '';
  const idError = descritoPor
    .split(/\s+/)
    .find(
      (id) =>
        id &&
        (id.startsWith('error-') || doc.getElementById(id)?.classList.contains('invalid-feedback')),
    );
  if (idError) {
    return doc.getElementById(idError);
  }
  if (campo.id) {
    return doc.getElementById(`error-${campo.id}`);
  }
  return null;
}

/**
 * Enlaza la caja de error al atributo `aria-describedby` del campo sin perder ayudas previas.
 * @param {HTMLElement} campo
 * @param {HTMLElement|null} cajaError
 */
function enlazarAriaDescribedBy(campo, cajaError) {
  if (!cajaError || !cajaError.id) return;
  const existentes = (campo.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  if (!existentes.includes(cajaError.id)) {
    existentes.push(cajaError.id);
    campo.setAttribute('aria-describedby', existentes.join(' '));
  }
}

/**
 * Traduce los errores nativos de `ValidityState` a un mensaje claro en español si no hubo validador propio.
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} campo
 * @returns {string}
 */
function obtenerMensajeNativo(campo) {
  const { validity } = campo;
  if (validity.valueMissing) {
    return campo.type === 'checkbox'
      ? 'Debes marcar esta casilla para continuar'
      : 'Este campo es obligatorio';
  }
  if (validity.typeMismatch && campo.type === 'email') {
    return 'El formato de correo no es válido';
  }
  if (validity.tooShort) {
    return `Debe tener al menos ${campo.minLength} caracteres`;
  }
  if (validity.tooLong) {
    return `No puede superar los ${campo.maxLength} caracteres`;
  }
  if (validity.rangeUnderflow) {
    return `El valor mínimo permitido es ${campo.min}`;
  }
  if (validity.rangeOverflow) {
    return `El valor máximo permitido es ${campo.max}`;
  }
  return campo.validationMessage || 'Revisa el valor introducido';
}

/**
 * Comprueba si un elemento es un control validable dentro del formulario.
 * @param {EventTarget|null} nodo
 * @returns {boolean}
 */
function esCampoValidable(nodo) {
  if (!nodo || !(nodo instanceof HTMLElement)) return false;
  const etiqueta = nodo.tagName;
  if (etiqueta !== 'INPUT' && etiqueta !== 'SELECT' && etiqueta !== 'TEXTAREA') {
    return false;
  }
  if (nodo.type === 'hidden' || nodo.type === 'submit' || nodo.type === 'button') {
    return false;
  }
  return true;
}

/**
 * Crea y conecta la validación en tiempo real y accesible sobre un formulario HTML.
 *
 * @param {HTMLFormElement} formulario
 * @param {Object} [opciones={}]
 * @param {Document} [opciones.doc=document]
 * @param {Record<string, (campo: HTMLElement) => {valido: boolean, motivo?: string}>} [opciones.reglasExtra={}]
 *   Reglas personalizadas por `id` o `data-validar` (ej. comprobar usuario duplicado o repetir clave).
 * @param {Record<string, string[]>} [opciones.dependencias={}]
 *   Mapa `idCampoOrigen -> idsCamposDependientes` que se revalidan cuando cambia el origen.
 * @returns {{
 *   validarCampo: (campo: HTMLElement, forzarTocado?: boolean) => boolean,
 *   limpiarCampo: (campo: HTMLElement) => void,
 *   validarFormulario: () => {valido: boolean, primerError: HTMLElement|null},
 * }}
 * @listens FocusEvent#blur
 * @listens Event#input
 * @listens Event#change
 */
export function configurarValidacionFormulario(
  formulario,
  { doc = document, reglasExtra = {}, dependencias = {} } = {},
) {
  const camposTocados = new WeakSet();

  /**
   * Limpia por completo el estado visual y accesible de error de un campo (ej. al desactivarlo).
   * @param {HTMLElement} campo
   */
  function limpiarCampo(campo) {
    if (!esCampoValidable(campo)) return;
    campo.setCustomValidity('');
    campo.classList.remove('is-invalid');
    campo.removeAttribute('aria-invalid');
    const cajaError = obtenerCajaError(campo, doc);
    if (cajaError) {
      cajaError.textContent = '';
    }
  }

  /**
   * Evalúa un campo concreto, actualiza `setCustomValidity`, clases Bootstrap y atributos ARIA.
   * @param {HTMLElement} campo
   * @param {boolean} [forzarTocado=false]
   * @returns {boolean} True si el campo es válido o está desactivado.
   */
  function validarCampo(campo, forzarTocado = false) {
    if (!esCampoValidable(campo)) return true;

    if (campo.disabled) {
      limpiarCampo(campo);
      return true;
    }

    if (forzarTocado) {
      camposTocados.add(campo);
    }

    const cajaError = obtenerCajaError(campo, doc);
    enlazarAriaDescribedBy(campo, cajaError);

    // Restablecer mensaje personalizado antes de evaluar
    campo.setCustomValidity('');

    let mensajeError = '';
    const claveValidador = campo.dataset.validar;

    if (claveValidador && Object.hasOwn(validadores, claveValidador)) {
      const resultado = validadores[claveValidador](campo.value);
      if (!resultado.valido) {
        mensajeError = resultado.motivo || 'Valor no válido';
      }
    }

    if (!mensajeError && campo.id && Object.hasOwn(reglasExtra, campo.id)) {
      const resultadoExtra = reglasExtra[campo.id](campo);
      if (!resultadoExtra.valido) {
        mensajeError = resultadoExtra.motivo || 'Valor no válido';
      }
    } else if (!mensajeError && claveValidador && Object.hasOwn(reglasExtra, claveValidador)) {
      const resultadoExtra = reglasExtra[claveValidador](campo);
      if (!resultadoExtra.valido) {
        mensajeError = resultadoExtra.motivo || 'Valor no válido';
      }
    }

    if (mensajeError) {
      campo.setCustomValidity(mensajeError);
    }

    const esValido = campo.checkValidity();

    if (!esValido) {
      const textoFinal = mensajeError || obtenerMensajeNativo(campo);
      campo.classList.add('is-invalid');
      campo.setAttribute('aria-invalid', 'true');
      if (cajaError) {
        cajaError.textContent = textoFinal;
      }
      return false;
    }

    campo.classList.remove('is-invalid');
    campo.setAttribute('aria-invalid', 'false');
    if (cajaError) {
      cajaError.textContent = '';
    }
    return true;
  }

  /**
   * Revalida los campos que dependen del campo recién modificado.
   * @param {HTMLElement} campoOrigen
   */
  function revalidarDependientes(campoOrigen) {
    if (!campoOrigen.id || !Object.hasOwn(dependencias, campoOrigen.id)) return;
    for (const idDependiente of dependencias[campoOrigen.id]) {
      const campoDependiente = doc.getElementById(idDependiente);
      if (campoDependiente && (camposTocados.has(campoDependiente) || campoDependiente.value)) {
        validarCampo(campoDependiente, true);
      }
    }
  }

  // Fase de CAPTURA para `blur` (no burbujea): primera validación al salir de cada campo
  formulario.addEventListener(
    'blur',
    (evento) => {
      if (!esCampoValidable(evento.target)) return;
      validarCampo(evento.target, true);
    },
    true,
  );

  // Fase de burbuja para `input`: revalida los campos ya tocados y sus dependientes
  formulario.addEventListener('input', (evento) => {
    const campo = evento.target;
    if (!esCampoValidable(campo)) return;
    if (camposTocados.has(campo)) {
      validarCampo(campo);
    }
    revalidarDependientes(campo);
  });

  // Fase de burbuja para `change`: cubre select, checkbox y controles de fecha
  formulario.addEventListener('change', (evento) => {
    const campo = evento.target;
    if (!esCampoValidable(campo)) return;
    if (camposTocados.has(campo) || campo.tagName === 'SELECT' || campo.type === 'checkbox') {
      validarCampo(campo, true);
    }
    revalidarDependientes(campo);
  });

  /**
   * Valida todos los campos activos del formulario (usado al enviar) y devuelve el primero con error.
   * @returns {{valido: boolean, primerError: HTMLElement|null}}
   */
  function validarFormulario() {
    let primerError = null;
    const controles = Array.from(formulario.elements).filter(esCampoValidable);

    for (const control of controles) {
      if (control.disabled) {
        limpiarCampo(control);
        continue;
      }
      const valido = validarCampo(control, true);
      if (!valido && !primerError) {
        primerError = control;
      }
    }

    return {
      valido: primerError === null,
      primerError,
    };
  }

  return {
    validarCampo,
    limpiarCampo,
    validarFormulario,
  };
}
