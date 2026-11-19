/**
 * Lógica del formulario de inicio de sesión (`index.html`).
 *
 * Elementos HTML requeridos:
 * - `#zona-avisos`, `#form-login`, `#usuario`, `#clave`, `#btn-entrar`
 * - `#error-usuario`, `#error-clave`
 *
 * @module paginas/login
 */

import { resumirClave } from '../clave.js';
import { verificarCredenciales } from '../datos/usuarios.js';
import { guardarSesion, haySesion } from '../datos/sesion.js';
import { lanzarAviso, guardarAvisoPendiente, inicializarAvisos } from '../avisos.js';
import { vincularBotonesVerClave } from '../componentes/claveVisible.js';
import { configurarValidacionFormulario } from '../componentes/validacionFormulario.js';

/**
 * Inicializa la página de inicio de sesión con validación accesible en tiempo real.
 * @param {Object} [deps={}]
 * @param {Document} [deps.doc=document]
 * @param {Storage} [deps.almacenUsuarios=localStorage]
 * @param {Storage} [deps.almacenSesion=sessionStorage]
 * @param {Location} [deps.localizacion=window.location]
 * @param {Function} [deps.resumidor=resumirClave]
 * @fires CustomEvent#aviso
 */
export function iniciarLogin({
  doc = document,
  almacenUsuarios = localStorage,
  almacenSesion = sessionStorage,
  localizacion = window.location,
  resumidor = resumirClave,
} = {}) {
  inicializarAvisos(doc);

  // Requisito 6: si ya hay sesión activa, redirige directamente al listado
  if (haySesion(almacenSesion)) {
    localizacion.replace('listado.html');
    return;
  }

  const formulario = doc.getElementById('form-login');
  if (!formulario) return;

  vincularBotonesVerClave(formulario, doc);

  const campoUsuario = doc.getElementById('usuario');
  const campoClave = doc.getElementById('clave');
  const botonEntrar = doc.getElementById('btn-entrar');

  const validador = configurarValidacionFormulario(formulario, {
    doc,
    reglasExtra: {
      usuario: (campo) =>
        campo.value.trim()
          ? { valido: true }
          : { valido: false, motivo: 'Introduce tu nombre de entrenador' },
      clave: (campo) =>
        campo.value ? { valido: true } : { valido: false, motivo: 'Introduce tu contraseña' },
    },
  });

  let procesandoEnvio = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    // Requisito 6: evitar doble envío (otro clic o Intro durante el cálculo)
    if (procesandoEnvio) return;

    const { valido, primerError } = validador.validarFormulario();
    if (!valido) {
      lanzarAviso(formulario, 'Por favor, completa tu usuario y contraseña', 'warning');
      if (primerError) primerError.focus();
      return;
    }

    const nombreUsuario = campoUsuario.value.trim();
    const clave = campoClave.value;

    try {
      procesandoEnvio = true;
      if (botonEntrar) {
        botonEntrar.disabled = true;
        botonEntrar.textContent = 'Verificando...';
      }

      const resumen = await resumidor(clave);
      const usuario = verificarCredenciales(nombreUsuario, resumen, almacenUsuarios);

      if (!usuario) {
        // Requisito 6: con contraseña o usuario incorrecto, avisa, vacía la clave y le da el foco
        lanzarAviso(formulario, 'Nombre de usuario o contraseña incorrectos', 'danger');
        campoClave.value = '';
        validador.limpiarCampo(campoClave);
        campoClave.focus();
        return;
      }

      guardarSesion({ nombreUsuario: usuario.nombreUsuario, rol: usuario.rol }, almacenSesion);
      guardarAvisoPendiente(`¡Bienvenido de nuevo, ${usuario.nombreUsuario}!`, 'success');
      localizacion.replace('listado.html');
    } catch {
      lanzarAviso(
        formulario,
        'Ocurrió un error inesperado al procesar el inicio de sesión',
        'danger',
      );
    } finally {
      procesandoEnvio = false;
      if (botonEntrar) {
        botonEntrar.disabled = false;
        botonEntrar.textContent = 'Iniciar Sesión';
      }
    }
  });
}
