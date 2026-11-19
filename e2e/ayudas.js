/**
 * Funciones de ayuda reutilizables para los recorridos E2E con Playwright.
 * @module e2e/ayudas
 */

/**
 * Registra un nuevo entrenador desde la página de registro.
 * @param {import('@playwright/test').Page} page
 * @param {Object} datos
 * @param {string} [datos.usuario='AshKetchum']
 * @param {string} [datos.email='ash@kanto.org']
 * @param {string} [datos.clave='Pikachu123']
 */
export async function registrarse(
  page,
  { usuario = 'AshKetchum', email = 'ash@kanto.org', clave = 'Pikachu123' } = {},
) {
  await page.goto('/registro.html');
  await page.getByLabel('Nombre de entrenador').fill(usuario);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.locator('#clave').fill(clave);
  await page.locator('#repetir-clave').fill(clave);
  await page.getByLabel('Acepto las normas y términos del Salón de la Fama PokeMemories').check();
  await page.getByRole('button', { name: 'Crear cuenta de Entrenador' }).click();
  await page.waitForURL('**/listado.html');
}

/**
 * Inicia sesión con un entrenador existente desde la página de login.
 * @param {import('@playwright/test').Page} page
 * @param {Object} datos
 * @param {string} [datos.usuario='AshKetchum']
 * @param {string} [datos.clave='Pikachu123']
 */
export async function iniciarSesion(page, { usuario = 'AshKetchum', clave = 'Pikachu123' } = {}) {
  await page.goto('/index.html');
  await page.getByLabel('Nombre de Entrenador').fill(usuario);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(clave);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.waitForURL('**/listado.html');
}

/**
 * Rellena y envía la ficha de una nueva partida.
 * @param {import('@playwright/test').Page} page
 * @param {Object} datos
 */
export async function crearRecuerdo(
  page,
  {
    edicion = 'HeartGold',
    numero = '0042',
    titulo = 'Oro HeartGold en mi 3ds',
    fecha = '2026-10-15',
    tiempo = '45:30',
    idEntrenador = '00151-7',
    mote = 'Typhlosion',
    nivel = '65',
    movimiento = 'Lanzallamas',
  } = {},
) {
  await page.goto('/ficha.html');
  await page.locator(`label[data-edicion="${edicion}"]`).click();
  await page.getByLabel('Código de registro').fill(numero);
  await page.getByLabel('Título de la partida').fill(titulo);
  await page.getByLabel('Fecha de victoria').fill(fecha);
  await page.getByLabel('Tiempo de juego').fill(tiempo);
  await page.getByLabel('ID de Entrenador').fill(idEntrenador);

  const filaEquipo = page.locator('[data-fila-pokemon]').first();
  await filaEquipo.locator('input[name="pokemonMote"]').fill(mote);
  await filaEquipo.locator('input[name="pokemonNivel"]').fill(nivel);
  await filaEquipo.locator('input[name="pokemonMovimiento"]').fill(movimiento);

  await page.getByRole('button', { name: 'Guardar recuerdo' }).click();
  await page.waitForURL('**/listado.html');
}
