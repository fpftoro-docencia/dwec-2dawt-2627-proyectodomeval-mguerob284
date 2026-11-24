import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { guardarSesion } from '../../js/datos/sesion.js';
import { crearPartida, obtenerPartidas } from '../../js/datos/partidas.js';
import { iniciarFicha } from '../../js/paginas/ficha.js';

describe('Integración: Ficha de recuerdo (ficha.html)', () => {
  let almacenPartidas;
  let almacenSesion;
  let localizacion;
  const fechaReferencia = new Date('2026-11-19T10:00:00Z');

  beforeEach(() => {
    cargarPagina('ficha.html');
    almacenPartidas = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    guardarSesion({ nombreUsuario: 'AshKetchum', rol: 'usuario' }, almacenSesion);

    localizacion = {
      pathname: '/ficha.html',
      search: '',
      hash: '',
      replace: vi.fn(),
      href: '',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('valida campos en fase de captura al salir (blur) y al escribir (input)', () => {
    iniciarFicha({
      doc: document,
      almacenPartidas,
      almacenSesion,
      localizacion,
      fechaReferencia,
    });

    const campoTitulo = document.getElementById('titulo');
    const errorTitulo = document.getElementById('error-titulo');

    // Al salir sin rellenar muestra error (Requisito 14)
    salir(campoTitulo);
    expect(campoTitulo.classList.contains('is-invalid')).toBe(true);
    expect(errorTitulo.textContent).toContain('El título de la partida es obligatorio');

    // Al escribir un título válido elimina el error en tiempo real
    escribir(campoTitulo, 'Oro HeartGold en mi 3ds');
    expect(campoTitulo.classList.contains('is-invalid')).toBe(false);
    expect(errorTitulo.textContent).toBe('');
  });

  it('permite añadir y quitar miembros del equipo campeón respetando el mínimo de 1 y máximo de 6', () => {
    iniciarFicha({
      doc: document,
      almacenPartidas,
      almacenSesion,
      localizacion,
      fechaReferencia,
    });

    const listaEquipo = document.getElementById('lista-equipo');
    const btnAnadir = document.getElementById('btn-anadir-pokemon');
    const contadorEquipo = document.getElementById('contador-equipo');

    // Inicialmente hay 1 Pokémon
    expect(listaEquipo.querySelectorAll('[data-fila-pokemon]')).toHaveLength(1);
    expect(contadorEquipo.textContent).toBe('1 de 6 Pokémon en tu equipo');

    // Añadir hasta el límite de 6
    for (let i = 2; i <= 6; i += 1) {
      btnAnadir.click();
    }
    expect(listaEquipo.querySelectorAll('[data-fila-pokemon]')).toHaveLength(6);
    expect(contadorEquipo.textContent).toBe('6 de 6 Pokémon en tu equipo');
    expect(btnAnadir.disabled).toBe(true);

    // Intentar quitar uno mediante delegación de eventos
    const btnQuitar = listaEquipo.querySelector('button[data-accion="quitar-pokemon"]');
    btnQuitar.click();
    expect(listaEquipo.querySelectorAll('[data-fila-pokemon]')).toHaveLength(5);
    expect(contadorEquipo.textContent).toBe('5 de 6 Pokémon en tu equipo');
    expect(btnAnadir.disabled).toBe(false);
  });

  it('gestiona la activación y validación condicional de modalidades Locke y Leyendas Caídas', () => {
    iniciarFicha({
      doc: document,
      almacenPartidas,
      almacenSesion,
      localizacion,
      fechaReferencia,
    });

    const radioLocke = document.getElementById('tipo-locke');
    const radioClasica = document.getElementById('tipo-clasica');
    const bloqueLocke = document.getElementById('bloque-modalidades-locke');
    const casillasLocke = document.querySelectorAll('input[name="modalidadesLocke"]');

    // Por defecto es Clásica y el bloque Locke está oculto y deshabilitado
    expect(radioClasica.checked).toBe(true);
    expect(bloqueLocke.hidden).toBe(true);
    casillasLocke.forEach((casilla) => expect(casilla.disabled).toBe(true));

    // Seleccionar Locke activa el bloque
    radioLocke.checked = true;
    radioLocke.dispatchEvent(new Event('change', { bubbles: true }));
    expect(bloqueLocke.hidden).toBe(false);
    casillasLocke.forEach((casilla) => expect(casilla.disabled).toBe(false));

    // Casilla de Leyendas Caídas
    const checkLeyendas = document.getElementById('hubo-leyendas-caidas');
    const bloqueLeyendas = document.getElementById('bloque-leyendas-caidas');
    const listaLeyendas = document.getElementById('lista-leyendas');

    expect(checkLeyendas.checked).toBe(false);
    expect(bloqueLeyendas.hidden).toBe(true);

    // Marcar Leyendas Caídas muestra el bloque y añade una fila inicial
    checkLeyendas.checked = true;
    checkLeyendas.dispatchEvent(new Event('change', { bubbles: true }));
    expect(bloqueLeyendas.hidden).toBe(false);
    expect(listaLeyendas.querySelectorAll('[data-fila-leyenda]')).toHaveLength(1);
  });

  it('guarda un nuevo recuerdo con los datos exactos recogidos por FormData y redirige', () => {
    iniciarFicha({
      doc: document,
      almacenPartidas,
      almacenSesion,
      localizacion,
      fechaReferencia,
    });

    // Seleccionar edición (ej. HeartGold)
    const radioHG = document.querySelector('input[name="edicion"][value="HeartGold"]');
    radioHG.checked = true;
    radioHG.dispatchEvent(new Event('change', { bubbles: true }));

    // Rellenar campos del formulario
    escribir(document.getElementById('codigo-numero'), '0042');
    escribir(document.getElementById('titulo'), 'Oro HeartGold en mi 3ds');
    escribir(document.getElementById('fecha-victoria'), '2026-10-15');
    escribir(document.getElementById('tiempo-juego'), '45:30');
    escribir(document.getElementById('id-entrenador'), '00151-7');

    // Rellenar Pokémon del equipo
    const filaEquipo = document.querySelector('[data-fila-pokemon]');
    escribir(filaEquipo.querySelector('input[data-campo="especie"]'), 'Typhlosion');
    escribir(filaEquipo.querySelector('input[name="pokemonNivel"]'), '65');
    escribir(filaEquipo.querySelector('input[name="pokemonMovimiento"]'), 'Lanzallamas');

    const form = document.getElementById('form-partida');
    form.requestSubmit();

    // Comprobar que se ha guardado en el almacenamiento
    const partidasGuardadas = obtenerPartidas('AshKetchum', almacenPartidas);
    expect(partidasGuardadas).toHaveLength(1);
    expect(partidasGuardadas[0]).toMatchObject({
      codigoRegistro: 'POKE-HGD-0042',
      titulo: 'Oro HeartGold en mi 3ds',
      edicion: 'HeartGold',
      fechaVictoria: '2026-10-15',
      tiempoJuego: '45:30',
      idEntrenador: '00151-7',
      tipoPartida: 'Clásica',
      modalidadesLocke: [],
      huboLeyendasCaidas: false,
      leyendasCaidas: [],
      equipo: [
        {
          mote: 'Typhlosion',
          nivel: 65,
          movimientoClave: 'Lanzallamas',
        },
      ],
    });

    // Redirige a listado.html
    expect(localizacion.replace).toHaveBeenCalledWith('listado.html');
  });

  it('permite editar un recuerdo existente cargado por id en la URL', () => {
    const partidaInicial = crearPartida(
      'AshKetchum',
      {
        codigoRegistro: 'POKE-PLT-0007',
        titulo: 'Platino Inicial',
        edicion: 'Platino',
        fechaVictoria: '2026-09-01',
        tiempoJuego: '30:00',
        idEntrenador: '12345-5',
        tipoPartida: 'Locke',
        modalidadesLocke: ['Nuzlocke'],
        huboLeyendasCaidas: true,
        leyendasCaidas: [
          {
            mote: 'Staraptor',
            nivel: 35,
            hazana: 'Hizo un crítico, congeló y se tanqueó un A bocajarro en la medalla 7',
          },
        ],
        equipo: [{ mote: 'Torterra', nivel: 55, movimientoClave: 'Terremoto' }],
      },
      almacenPartidas,
    );

    localizacion.search = `?id=${partidaInicial.id}`;

    iniciarFicha({
      doc: document,
      almacenPartidas,
      almacenSesion,
      localizacion,
      fechaReferencia,
    });

    // Comprobar precarga de datos
    expect(document.getElementById('titulo').value).toBe('Platino Inicial');
    expect(document.getElementById('codigo-numero').value).toBe('0007');
    expect(document.getElementById('tipo-locke').checked).toBe(true);
    expect(document.getElementById('hubo-leyendas-caidas').checked).toBe(true);

    // Modificar título y guardar
    escribir(document.getElementById('titulo'), 'Platino Editado Campeón');
    document.getElementById('form-partida').requestSubmit();

    const actualizadas = obtenerPartidas('AshKetchum', almacenPartidas);
    expect(actualizadas).toHaveLength(1);
    expect(actualizadas[0].titulo).toBe('Platino Editado Campeón');
    expect(actualizadas[0].id).toBe(partidaInicial.id);
    expect(localizacion.replace).toHaveBeenCalledWith('listado.html');
  });
});
