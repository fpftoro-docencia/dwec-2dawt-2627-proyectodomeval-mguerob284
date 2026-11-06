/**
 * Lógica del formulario de inicio de sesión (index.html).
 * @module paginas/login
 */

import { resumirClave } from '../clave.js';
import { verificarCredenciales } from '../datos/usuarios.js';
import { guardarSesion, haySesion } from '../datos/sesion.js';
import { lanzarAviso, guardarAvisoPendiente, inicializarAvisos } from '../avisos.js';

/**
 * Inicializa la página de inicio de sesión.
 * @param {Object} [deps={}]
 * @param {Document} [deps.doc=document]
 * @param {Storage} [deps.almacenUsuarios=localStorage]
 * @param {Storage} [deps.almacenSesion=sessionStorage]
 * @param {Location} [deps.localizacion=window.location]
 * @param {Function} [deps.resumidor=resumirClave]
 */
export function iniciarLogin({
  doc = document,
  almacenUsuarios = localStorage,
  almacenSesion = sessionStorage,
  localizacion = window.location,
  resumidor = resumirClave
} = {}) {
  inicializarAvisos(doc);

  // Requisito 6: si ya hay sesión activa, redirige directamente al listado
  if (haySesion(almacenSesion)) {
    localizacion.replace('listado.html');
    return;
  }

  const formulario = doc.getElementById('form-login');
  if (!formulario) return;

  const campoUsuario = doc.getElementById('usuario');
  const campoClave = doc.getElementById('clave');
  const botonEntrar = doc.getElementById('btn-entrar');

  let procesandoEnvio = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    // Requisito 6: evitar doble envío (otro clic o Intro durante el cálculo)
    if (procesandoEnvio) return;

    const nombreUsuario = campoUsuario.value.trim();
    const clave = campoClave.value;

    if (!nombreUsuario || !clave) {
      lanzarAviso(formulario, 'Por favor, introduce tu usuario y contraseña.', 'warning');
      return;
    }

    try {
      procesandoEnvio = true;
      if (botonEntrar) {
        botonEntrar.disabled = true;
        botonEntrar.textContent = 'Verificando...';
      }

      // Cálculo asíncrono del resumen SHA-256
      const resumen = await resumidor(clave);
      const usuario = verificarCredenciales(nombreUsuario, resumen, almacenUsuarios);

      if (!usuario) {
        // Requisito 6: con contraseña o usuario incorrecto, avisa, vacía la clave y le da el foco
        lanzarAviso(
          formulario,
          'Nombre de usuario o contraseña incorrectos.',
          'danger'
        );
        campoClave.value = '';
        campoClave.focus();
        return;
      }

      // Inicio de sesión exitoso
      guardarSesion(
        { nombreUsuario: usuario.nombreUsuario, rol: usuario.rol },
        almacenSesion
      );
      guardarAvisoPendiente(`¡Bienvenido de nuevo, ${usuario.nombreUsuario}!`, 'success');
      localizacion.replace('listado.html');
    } catch {
      lanzarAviso(
        formulario,
        'Ocurrió un error inesperado al procesar el inicio de sesión.',
        'danger'
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
