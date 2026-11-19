import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { guardarSesion } from '../../js/datos/sesion.js';
import { guardarUsuarios } from '../../js/datos/usuarios.js';
import { iniciarUsuarios } from '../../js/paginas/usuarios.js';

describe('Integración: Zona de administración de usuarios (usuarios.html)', () => {
  let almacenUsuarios;
  let almacenSesion;
  let localizacion;
  let historial;

  beforeEach(() => {
    vi.useFakeTimers();
    cargarPagina('usuarios.html');
    almacenUsuarios = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();

    localizacion = {
      pathname: '/usuarios.html',
      search: '',
      hash: '',
      replace: vi.fn(),
      href: '',
    };
    historial = {
      replaceState: vi.fn((...argumentos) => {
        const [, query = ''] = String(argumentos[2]).split('?');
        localizacion.search = query ? `?${query}` : '';
      }),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('bloquea el acceso a usuarios no administradores y redirige a listado.html', () => {
    guardarSesion({ nombreUsuario: 'Misty', rol: 'usuario' }, almacenSesion);

    iniciarUsuarios({
      doc: document,
      almacenUsuarios,
      almacenSesion,
      localizacion,
      historial,
    });

    expect(localizacion.replace).toHaveBeenCalledWith('listado.html');
    // La tabla no debe haberse renderizado
    expect(document.querySelectorAll('#lista-usuarios tr')).toHaveLength(0);
  });

  it('permite el acceso a administradores y muestra el listado con insignias', () => {
    guardarSesion({ nombreUsuario: 'AshKetchum', rol: 'administrador' }, almacenSesion);
    guardarUsuarios(
      [
        {
          nombreUsuario: 'AshKetchum',
          email: 'ash@kanto.org',
          contrasena: 'Hash123',
          rol: 'administrador',
        },
        {
          nombreUsuario: 'Brock',
          email: 'brock@pewter.org',
          contrasena: 'Hash123',
          rol: 'usuario',
        },
      ],
      almacenUsuarios,
    );

    iniciarUsuarios({
      doc: document,
      almacenUsuarios,
      almacenSesion,
      localizacion,
      historial,
    });

    const filas = document.querySelectorAll('#lista-usuarios tr');
    expect(filas).toHaveLength(2);
    expect(filas[0].textContent).toContain('AshKetchum');
    expect(filas[0].textContent).toContain('Tú');
    expect(filas[1].textContent).toContain('Brock');
  });

  it('impide que un administrador se quite su propio rol de administrador', () => {
    guardarSesion({ nombreUsuario: 'AshKetchum', rol: 'administrador' }, almacenSesion);
    guardarUsuarios(
      [
        {
          nombreUsuario: 'AshKetchum',
          email: 'ash@kanto.org',
          contrasena: 'Hash123',
          rol: 'administrador',
        },
      ],
      almacenUsuarios,
    );

    iniciarUsuarios({
      doc: document,
      almacenUsuarios,
      almacenSesion,
      localizacion,
      historial,
    });

    const botonPropio = document.querySelector('button[data-usuario="AshKetchum"]');
    expect(botonPropio.disabled).toBe(true);
    expect(botonPropio.title).toContain('No puedes quitarte tu propio rol de administrador');
    expect(document.getElementById('aviso-propio-1').textContent).toContain(
      'No puedes quitarte tu propio rol de administrador',
    );
  });

  it('permite cambiar el rol de otro usuario mediante delegación de eventos', () => {
    guardarSesion({ nombreUsuario: 'AshKetchum', rol: 'administrador' }, almacenSesion);
    guardarUsuarios(
      [
        {
          nombreUsuario: 'AshKetchum',
          email: 'ash@kanto.org',
          contrasena: 'Hash123',
          rol: 'administrador',
        },
        {
          nombreUsuario: 'Brock',
          email: 'brock@pewter.org',
          contrasena: 'Hash123',
          rol: 'usuario',
        },
      ],
      almacenUsuarios,
    );

    iniciarUsuarios({
      doc: document,
      almacenUsuarios,
      almacenSesion,
      localizacion,
      historial,
    });

    const botonBrock = document.querySelector('button[data-usuario="Brock"]');
    expect(botonBrock.textContent).toBe('Hacer administrador');

    botonBrock.click();

    const botonBrockActualizado = document.querySelector('button[data-usuario="Brock"]');
    expect(botonBrockActualizado.textContent).toBe('Quitar administrador');
    expect(document.getElementById('zona-avisos').textContent).toContain(
      'Brock ahora tiene permisos de administrador',
    );
  });

  it('filtra usuarios por búsqueda con debounce y pagina la tabla', () => {
    guardarSesion({ nombreUsuario: 'AshKetchum', rol: 'administrador' }, almacenSesion);
    const lista = [];
    for (let i = 1; i <= 5; i += 1) {
      lista.push({
        nombreUsuario: `Entrenador${i}`,
        email: `entrenador${i}@poke.org`,
        contrasena: 'Hash123',
        rol: 'usuario',
      });
    }
    guardarUsuarios(lista, almacenUsuarios);

    iniciarUsuarios({
      doc: document,
      almacenUsuarios,
      almacenSesion,
      localizacion,
      historial,
      porPagina: 2,
      retardoBusqueda: 250,
    });

    expect(document.querySelectorAll('#lista-usuarios tr')).toHaveLength(2);

    const buscador = document.getElementById('buscador-usuarios');
    escribir(buscador, 'Entrenador3');

    // Antes del debounce sigue la página inicial
    expect(document.querySelectorAll('#lista-usuarios tr')).toHaveLength(2);

    vi.advanceTimersByTime(250);

    const filasFiltradas = document.querySelectorAll('#lista-usuarios tr');
    expect(filasFiltradas).toHaveLength(1);
    expect(filasFiltradas[0].textContent).toContain('Entrenador3');
  });
});
