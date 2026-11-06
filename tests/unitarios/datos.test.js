import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerUsuarios,
  guardarUsuarios,
  buscarUsuario,
  existeUsuario,
  registrarUsuario,
  verificarCredenciales
} from '../../js/datos/usuarios.js';
import {
  guardarSesion,
  obtenerSesion,
  cerrarSesion,
  haySesion
} from '../../js/datos/sesion.js';

describe('Módulo de datos: Usuarios', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('guarda y lee la lista de usuarios correctamente', () => {
    expect(obtenerUsuarios(almacen)).toEqual([]);

    const usuario = {
      nombreUsuario: 'Ash',
      email: 'ash@pueblopaleta.es',
      resumenClave: 'hash123',
      rol: 'administrador',
      fechaRegistro: new Date().toISOString()
    };

    guardarUsuarios([usuario], almacen);
    const leidos = obtenerUsuarios(almacen);
    expect(leidos).toHaveLength(1);
    expect(leidos[0].nombreUsuario).toBe('Ash');
  });

  it('el primer usuario registrado es automáticamente administrador (Requisito 4)', () => {
    const primer = registrarUsuario(
      { nombreUsuario: 'ProfesorOak', email: 'oak@lab.es', resumenClave: 'oakHash' },
      almacen
    );
    expect(primer.rol).toBe('administrador');

    const segundo = registrarUsuario(
      { nombreUsuario: 'Red', email: 'red@kanto.es', resumenClave: 'redHash' },
      almacen
    );
    expect(segundo.rol).toBe('usuario');
  });

  it('no permite registrar un nombre de usuario repetido', () => {
    registrarUsuario(
      { nombreUsuario: 'Misty', email: 'misty@cerulean.es', resumenClave: 'clave1' },
      almacen
    );

    expect(() =>
      registrarUsuario(
        { nombreUsuario: 'misty', email: 'misty2@cerulean.es', resumenClave: 'clave2' },
        almacen
      )
    ).toThrow('El nombre de usuario ya está registrado');
  });

  it('verifica credenciales correctamente (correcta e incorrecta)', () => {
    registrarUsuario(
      { nombreUsuario: 'Brock', email: 'brock@pewter.es', resumenClave: 'rocaSolida' },
      almacen
    );

    const correcto = verificarCredenciales('Brock', 'rocaSolida', almacen);
    expect(correcto).not.toBeNull();
    expect(correcto.nombreUsuario).toBe('Brock');

    const claveIncorrecta = verificarCredenciales('Brock', 'claveFalsa', almacen);
    expect(claveIncorrecta).toBeNull();

    const noExiste = verificarCredenciales('Giovanni', 'rocaSolida', almacen);
    expect(noExiste).toBeNull();
  });

  it('no falla si los datos de usuarios en el almacenamiento están estropeados (Requisito 3)', () => {
    almacen.setItem('PokeMemories_usuarios', '{ datos corruptos que no son json');
    expect(obtenerUsuarios(almacen)).toEqual([]);

    almacen.setItem('PokeMemories_usuarios', '12345'); // no es array
    expect(obtenerUsuarios(almacen)).toEqual([]);
  });
});

describe('Módulo de datos: Sesión', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('guarda, lee y cierra la sesión', () => {
    expect(obtenerSesion(almacen)).toBeNull();
    expect(haySesion(almacen)).toBe(false);

    guardarSesion({ nombreUsuario: 'Ash', rol: 'usuario' }, almacen);
    expect(haySesion(almacen)).toBe(true);
    expect(obtenerSesion(almacen)).toEqual({ nombreUsuario: 'Ash', rol: 'usuario' });

    cerrarSesion(almacen);
    expect(haySesion(almacen)).toBe(false);
    expect(obtenerSesion(almacen)).toBeNull();
  });

  it('no falla si los datos de sesión están estropeados (Requisito 3)', () => {
    almacen.setItem('PokeMemories_sesion', '<<<basura>>>');
    expect(obtenerSesion(almacen)).toBeNull();
    expect(haySesion(almacen)).toBe(false);

    // Objeto con rol inválido
    almacen.setItem('PokeMemories_sesion', JSON.stringify({ nombreUsuario: 'Hacker', rol: 'superadmin' }));
    expect(obtenerSesion(almacen)).toBeNull();
  });
});
