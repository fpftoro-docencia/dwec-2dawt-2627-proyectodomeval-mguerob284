/**
 * Lógica del formulario de registro de entrenadores (registro.html).
 * @module paginas/registro
 */

import { resumirClave } from '../clave.js';
import { registrarUsuario, existeUsuario } from '../datos/usuarios.js';
import { guardarSesion, haySesion } from '../datos/sesion.js';
import {
  validarNombreUsuario,
  validarEmail,
  analizarRequisitosClave,
  validarRepeticionClave,
} from '../validadores.js';
import { lanzarAviso, guardarAvisoPendiente, inicializarAvisos } from '../avisos.js';

/**
 * Inicializa la página de registro.
 * @param {Object} [deps={}]
 * @param {Document} [deps.doc=document]
 * @param {Storage} [deps.almacenUsuarios=localStorage]
 * @param {Storage} [deps.almacenSesion=sessionStorage]
 * @param {Location} [deps.localizacion=window.location]
 * @param {Function} [deps.resumidor=resumirClave]
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

  const campoUsuario = doc.getElementById('usuario');
  const campoEmail = doc.getElementById('email');
  const campoClave = doc.getElementById('clave');
  const campoRepetir = doc.getElementById('repetir-clave');
  const campoAceptar = doc.getElementById('aceptar-terminos');
  const botonRegistro = doc.getElementById('btn-registrarse');

  // Elementos indicadores de requisitos de contraseña
  const reqLongitud = doc.getElementById('req-longitud');
  const reqMinuscula = doc.getElementById('req-minuscula');
  const reqMayuscula = doc.getElementById('req-mayuscula');
  const reqCifra = doc.getElementById('req-cifra');

  /**
   * Actualiza los indicadores visuales de los requisitos de la contraseña en tiempo real.
   */
  function actualizarIndicadoresClave() {
    const valor = campoClave.value;
    const analisis = analizarRequisitosClave(valor);

    actualizarElementoRequisito(reqLongitud, analisis.longitud);
    actualizarElementoRequisito(reqMinuscula, analisis.minuscula);
    actualizarElementoRequisito(reqMayuscula, analisis.mayuscula);
    actualizarElementoRequisito(reqCifra, analisis.cifra);
  }

  /**
   * @param {HTMLElement|null} el
   * @param {boolean} cumplido
   */
  function actualizarElementoRequisito(el, cumplido) {
    if (!el) return;
    if (cumplido) {
      el.classList.add('cumplido');
      el.classList.remove('pendiente');
      el.textContent = `✓ ${el.dataset.texto || el.textContent.replace(/^[✓✗•]\s*/, '')}`;
    } else {
      el.classList.remove('cumplido');
      el.classList.add('pendiente');
      el.textContent = `• ${el.dataset.texto || el.textContent.replace(/^[✓✗•]\s*/, '')}`;
    }
  }

  // Escuchar mientras se escribe la contraseña (Requisito 5)
  campoClave.addEventListener('input', () => {
    actualizarIndicadoresClave();
  });

  let procesandoEnvio = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    // Requisito 6: Bloqueo de segundo envío
    if (procesandoEnvio) return;

    // 1. Validar nombre de usuario
    const valUsuario = validarNombreUsuario(campoUsuario.value);
    if (!valUsuario.valido) {
      lanzarAviso(formulario, valUsuario.motivo, 'warning');
      campoUsuario.focus();
      return;
    }

    if (existeUsuario(campoUsuario.value, almacenUsuarios)) {
      lanzarAviso(formulario, 'El nombre de entrenador ya está en uso, elige otro', 'warning');
      campoUsuario.focus();
      return;
    }

    // 2. Validar correo
    const valEmail = validarEmail(campoEmail.value);
    if (!valEmail.valido) {
      lanzarAviso(formulario, valEmail.motivo, 'warning');
      campoEmail.focus();
      return;
    }

    // 3. Validar requisitos de contraseña
    const analisisClave = analizarRequisitosClave(campoClave.value);
    if (!analisisClave.esValida) {
      lanzarAviso(
        formulario,
        'La contraseña no cumple todos los requisitos de seguridad',
        'warning',
      );
      campoClave.focus();
      return;
    }

    // 4. Validar repetición de contraseña
    const valRepetir = validarRepeticionClave(campoClave.value, campoRepetir.value);
    if (!valRepetir.valido) {
      lanzarAviso(formulario, valRepetir.motivo, 'warning');
      campoRepetir.focus();
      return;
    }

    // 5. Validar casilla de aceptación
    if (!campoAceptar.checked) {
      lanzarAviso(
        formulario,
        'Debes aceptar las condiciones de PokeMemories para continuar',
        'warning',
      );
      campoAceptar.focus();
      return;
    }

    try {
      procesandoEnvio = true;
      if (botonRegistro) {
        botonRegistro.disabled = true;
        botonRegistro.textContent = 'Registrando...';
      }

      // Hash asíncrono
      const resumen = await resumidor(campoClave.value);

      const nuevoUsuario = registrarUsuario(
        {
          nombreUsuario: campoUsuario.value,
          email: campoEmail.value,
          resumenClave: resumen,
        },
        almacenUsuarios,
      );

      // Inicia sesión automáticamente tras el registro
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
