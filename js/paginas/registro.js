/**
 * Lógica del formulario de registro de entrenadores (`registro.html`).
 *
 * Elementos HTML requeridos:
 * - `#zona-avisos`, `#form-registro`
 * - `#usuario`, `#email`, `#clave`, `#repetir-clave`, `#aceptar-terminos`, `#btn-registrarse`
 * - `#req-longitud`, `#req-minuscula`, `#req-mayuscula`, `#req-cifra`
 * - `#error-usuario`, `#error-email`, `#error-clave`, `#error-repetir-clave`, `#error-terminos`
 *
 * @module paginas/registro
 */

import { resumirClave } from '../clave.js';
import { registrarUsuario, existeUsuario } from '../datos/usuarios.js';
import { guardarSesion, haySesion } from '../datos/sesion.js';
import { analizarRequisitosClave, validarRepeticionClave } from '../validadores.js';
import { lanzarAviso, guardarAvisoPendiente, inicializarAvisos } from '../avisos.js';
import { vincularBotonesVerClave } from '../componentes/claveVisible.js';
import { configurarValidacionFormulario } from '../componentes/validacionFormulario.js';

/**
 * Inicializa la página de registro con validación accesible en tiempo real.
 * @param {Object} [deps={}]
 * @param {Document} [deps.doc=document]
 * @param {Storage} [deps.almacenUsuarios=localStorage]
 * @param {Storage} [deps.almacenSesion=sessionStorage]
 * @param {Location} [deps.localizacion=window.location]
 * @param {Function} [deps.resumidor=resumirClave]
 * @fires CustomEvent#aviso
 */
export function iniciarRegistro({
  doc = document,
  almacenUsuarios = localStorage,
  almacenSesion = sessionStorage,
  localizacion = window.location,
  resumidor = resumirClave,
} = {}) {
  inicializarAvisos(doc);

  if (haySesion(almacenSesion)) {
    localizacion.replace('listado.html');
    return;
  }

  const formulario = doc.getElementById('form-registro');
  if (!formulario) return;

  vincularBotonesVerClave(formulario, doc);

  const campoUsuario = doc.getElementById('usuario');
  const campoEmail = doc.getElementById('email');
  const campoClave = doc.getElementById('clave');
  const botonRegistro = doc.getElementById('btn-registrarse');

  const reqLongitud = doc.getElementById('req-longitud');
  const reqMinuscula = doc.getElementById('req-minuscula');
  const reqMayuscula = doc.getElementById('req-mayuscula');
  const reqCifra = doc.getElementById('req-cifra');

  /**
   * Actualiza un indicador visual de requisito de contraseña.
   * @param {HTMLElement|null} el
   * @param {boolean} cumplido
   */
  function actualizarElementoRequisito(el, cumplido) {
    if (!el) return;
    const textoBase = el.dataset.texto || el.textContent.replace(/^[✓✗•]\s*/, '');
    if (cumplido) {
      el.classList.add('cumplido');
      el.classList.remove('pendiente');
      el.textContent = `✓ ${textoBase}`;
    } else {
      el.classList.remove('cumplido');
      el.classList.add('pendiente');
      el.textContent = `• ${textoBase}`;
    }
  }

  /**
   * Actualiza los indicadores visuales de los 4 requisitos de contraseña en vivo.
   */
  function actualizarIndicadoresClave() {
    const analisis = analizarRequisitosClave(campoClave.value);
    actualizarElementoRequisito(reqLongitud, analisis.longitud);
    actualizarElementoRequisito(reqMinuscula, analisis.minuscula);
    actualizarElementoRequisito(reqMayuscula, analisis.mayuscula);
    actualizarElementoRequisito(reqCifra, analisis.cifra);
  }

  campoClave.addEventListener('input', actualizarIndicadoresClave);

  const validador = configurarValidacionFormulario(formulario, {
    doc,
    reglasExtra: {
      usuario: (campo) =>
        existeUsuario(campo.value, almacenUsuarios)
          ? { valido: false, motivo: 'El nombre de entrenador ya está en uso, elige otro' }
          : { valido: true },
      'repetir-clave': (campo) => validarRepeticionClave(campoClave.value, campo.value),
      'aceptar-terminos': (campo) =>
        campo.checked
          ? { valido: true }
          : {
              valido: false,
              motivo: 'Debes aceptar las condiciones de PokeMemories para continuar',
            },
    },
    dependencias: {
      clave: ['repetir-clave'],
    },
  });

  let procesandoEnvio = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (procesandoEnvio) return;

    const { valido, primerError } = validador.validarFormulario();
    if (!valido) {
      lanzarAviso(formulario, 'Revisa los campos marcados en rojo antes de registrarte', 'warning');
      if (primerError) primerError.focus();
      return;
    }

    try {
      procesandoEnvio = true;
      if (botonRegistro) {
        botonRegistro.disabled = true;
        botonRegistro.textContent = 'Registrando...';
      }

      const resumen = await resumidor(campoClave.value);
      const nuevoUsuario = registrarUsuario(
        {
          nombreUsuario: campoUsuario.value,
          email: campoEmail.value,
          resumenClave: resumen,
        },
        almacenUsuarios,
      );

      guardarSesion(
        {
          nombreUsuario: nuevoUsuario.nombreUsuario,
          rol: nuevoUsuario.rol,
        },
        almacenSesion,
      );

      const mensajeBienvenida =
        nuevoUsuario.rol === 'administrador'
          ? `¡Bienvenido, Profesor ${nuevoUsuario.nombreUsuario}! Eres el primer usuario registrado y tienes rol de Administrador`
          : `¡Registro completado con éxito! Bienvenido a PokeMemories, ${nuevoUsuario.nombreUsuario}`;

      guardarAvisoPendiente(mensajeBienvenida, 'success');
      localizacion.replace('listado.html');
    } catch (error) {
      lanzarAviso(formulario, error.message || 'Error al procesar el registro', 'danger');
    } finally {
      procesandoEnvio = false;
      if (botonRegistro) {
        botonRegistro.disabled = false;
        botonRegistro.textContent = 'Crear cuenta de Entrenador';
      }
    }
  });
}
