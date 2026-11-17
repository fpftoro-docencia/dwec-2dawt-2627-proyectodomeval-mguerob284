# CONTEXTO.md · Memoria Viva del Proyecto PokeMemories

> **Propósito de este archivo:** Documento vivo de referencia rápida para mantener la continuidad total del proyecto entre sesiones, sprints o cambios de contexto. **Debe actualizarse cada vez que se añada una nueva funcionalidad, cambie una decisión de diseño o se complete un sprint.**

---

## 1. Identidad y Temática del Proyecto

* **Nombre oficial:** **PokeMemories** *(siempre sin tilde en la "e")*
* **Concepto:** Salón de la Fama y Álbum de Recuerdos de Partidas Pokémon. Cada entrenador registrado tiene su propia vitrina privada donde guardar partidas completadas (*HeartGold*, *Esmeralda*, *Platino*, *Rojo Fuego*, etc.), con sus horas de juego, fecha de victoria, licencia de entrenador y equipo de 1 a 6 Pokémon.
* **Toque distintivo («Leyendas Caídas»):** Además de los campeones del Hall of Fame, el formulario permite rendir homenaje a los Pokémon memorables que cayeron durante la aventura o no llegaron a la Liga (mediante un campo condicional de *Mención de honor* y el estado del Pokémon dentro del equipo).
* **Logo oficial:** Guardado en `img/logo.png` (Pokéball con "PokeMemories" y siluetas evolutivas de Charmander, Charmeleon y Charizard). Se usa como favicon en todas las páginas, cabecera en login/registro y marca animada en la barra de navegación privada.
* **Entorno Técnico y Restricciones (`ENUNCIADO.md`):**
  * JavaScript puro (ES Modules), HTML5 y CSS3.
  * **Solo CSS de Bootstrap** (`node_modules/bootstrap/dist/css/bootstrap.min.css`); **prohibido usar el JS de Bootstrap**.
  * **Sin APIs remotas** (prohibido llamar a PokeAPI): toda la persistencia es local en el navegador (`localStorage` para datos y usuarios; `sessionStorage` para la sesión).

---

## 2. Reglas de Estilo y Preferencias del Autor (OBLIGATORIO RESPETAR)

1. **Tono humano y natural en la interfaz:**
   * **Eliminar los puntos finales (`.`) en frases cortas**, mensajes de error, avisos de alerta (`lanzarAviso`), subtítulos, descripciones cortas de tarjetas y estados vacíos.
   * Solo mantener puntos en párrafos largos que contengan punto y seguido.
2. **Placeholders y textos específicos acordados:**
   * Nombre de entrenador (en `index.html` y `registro.html`): ejemplo unificado `AshKetchum` (`Ej. AshKetchum` / `De 3 a 15 caracteres (ej. AshKetchum)`).
   * Contraseña en `index.html`: `Introduzca su contraseña`
   * Contraseña en `registro.html`: `Introduzca una contraseña`
3. **Flujo de trabajo Git:**
   * `main` es producción. Las funcionalidades se desarrollan en ramas (ej. `feature/sprint-1-autenticacion`, `feature/sprint-2-datos-listado`) y se integran por Pull Request.
   * No borrar ramas tras fusionarlas.

---

## 3. Planificación, Fechas y Gestión

* **Repositorio:** `https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-mguerob284`
* **Tablero de Trello:** [PokeMemories en Trello](https://trello.com/b/XHNkmnw1/pokememories)
  * Columnas: `TO DO`, `DOING`, `DONE`
  * Etiquetas: `Sprint 1` (azul), `Sprint 2` (naranja), `Sprint 3` (morado)
  * *Nota:* Las credenciales de conexión a la API de Trello están guardadas localmente en `.env` (archivo ignorado por `.gitignore`, nunca subir a Git).
* **Calendario de Sprints:**
  * **Sprint 1 (`v0.1`):** Entrega **12 de Noviembre** — Usuarios, sesión, roles, pruebas unitarias iniciales y CI básica (Requisitos 1–12).
  * **Sprint 2 (`v0.2`):** Entrega **19 de Noviembre** — CRUD completo (`RegistroPartida`), buscador con debounce, paginación, zona admin, eventos avanzados, integración/E2E y cobertura ≥90% (Requisitos 13–23).
  * **Sprint 3 (`v1.0`):** Entrega **26 de Noviembre** — Despliegue continuo en Vercel, vistas previas, prueba de humo, Releases automáticas, JSDoc y exposición final (Requisitos 24–29).

---

## 4. Arquitectura y Funcionalidades Implementadas

### Estructura actual de archivos y módulos
* **Páginas HTML en raíz:**
  * `index.html`: Inicio de sesión (redirección si hay sesión, bloqueo de doble envío, vaciado y foco tras fallo, logo y favicon).
  * `registro.html`: Registro de entrenadores con indicador visual en vivo de los 4 requisitos de contraseña (`\p{Ll}`, `\p{Lu}`, `\d`, ≥8 caracteres), autologin y redirección.
  * `listado.html`: Vitrina completa de recuerdos con buscador con *debounce*, contador de resultados, `<template id="plantilla-partida">`, estado vacío dinámico, controles de paginación y `<dialog id="dialogo-borrar">` nativo.
  * `ficha.html`: Formulario de partida privado (esqueleto protegido — pendiente de completar en el segundo tercio del Sprint 2).
  * `usuarios.html`: Zona de administración protegida para rol `administrador` (esqueleto protegido — pendiente de completar en el segundo tercio del Sprint 2).
* **Estilos e Imágenes:**
  * `css/estilos.css`: Estilos de apoyo a Bootstrap (cabecera, animación del logo, `.cumplido` / `.pendiente`, `.tarjeta-partida`, `.bloque-leyenda-caida` y `.dialogo-confirmacion` con `::backdrop`).
  * `img/logo.png`: Logo oficial de PokeMemories.
* **Módulos JS (`js/`):**
  * `js/clave.js`: Hash SHA-256 asíncrono `resumirClave` (archivo original del profesor, **no modificar**).
  * `js/datos/usuarios.js`: CRUD básico de usuarios en `localStorage` (`PokeMemories_usuarios`). El primer usuario registrado es `administrador`, los siguientes `usuario`. Lecturas tolerantes a JSON corrupto.
  * `js/datos/sesion.js`: Gestión de sesión activa en `sessionStorage` (`PokeMemories_sesion`). Tolerante a datos corruptos.
  * `js/datos/partidas.js`: CRUD completo de `RegistroPartida` en `localStorage` con clave independiente por usuario (`PokeMemories_partidas_<usuario>`), `id` único (`crypto.randomUUID`), normalización de campos y lecturas seguras frente a JSON estropeado.
  * `js/avisos.js`: Emisión de evento propio `CustomEvent('aviso', { bubbles: true, detail })`, oyente único en `document` (protegido con `WeakSet` y renderizado seguro con `createElement`/`textContent`/`replaceChildren`) y soporte de avisos diferidos (`PokeMemories_aviso_pendiente`).
  * `js/validadores.js`: Funciones puras de registro y de la entidad `RegistroPartida` (`validarCodigoRegistro`, `validarTituloPartida`, `validarEdicion`, `validarFechaVictoria`, `validarTiempoJuego`, `validarLicenciaEntrenador` con DNI/NIE módulo 23, `validarMencionHonor`, equipo 1–6 Pokémon) y mapa unificado `validadores` (patrón Estrategia para `data-validar`).
  * `js/paginacion.js`: Funciones puras `normalizarTextoBusqueda`, `filtrarLista` (sin mayúsculas ni tildes) y `paginar(lista, pagina, porPagina)` con corrección de página fuera de rango.
  * `js/componentes/cabecera.js`: `protegerPagina()` (redirección con `location.replace`) y `renderizarCabecera()` con menú condicional para administradores y botón «Cerrar sesión».
  * `js/componentes/paginacion.js`: Renderizado DOM de controles («Anterior», números con `aria-current="page"`, «Siguiente»), delegación de eventos con `closest` y sincronización de `?pagina=` con `URLSearchParams` y `history.replaceState`.
  * `js/paginas/login.js`, `js/paginas/registro.js` y `js/paginas/listado.js`: Controladores con inyección de dependencias para pruebas en `happy-dom`.
* **Calidad, CI y Pruebas:**
  * `eslint.config.js`: Reglas añadidas (`no-var`, `prefer-const`, `eqeqeq`, `camelcase`, `no-console`, `no-duplicate-imports`).
  * `vitest.config.js`: Cobertura configurada sobre `js/validadores.js` y `js/paginacion.js` con umbral mínimo del 90% de líneas.
  * `tests/unitarios/datos.test.js`, `tests/unitarios/validadores.test.js`, `tests/unitarios/partidas.test.js`, `tests/unitarios/paginacion.test.js`: Batería unitaria completa con `AlmacenFalso` e `it.each`.
  * `tests/integracion/listado.test.js`: Prueba de integración en `happy-dom` (búsqueda con `vi.useFakeTimers()`, paginación con `history.replaceState` y borrado en `<dialog>`).
  * `.github/workflows/ci.yml`: Workflow de GitHub Actions (Paso 1; Paso 2 pendiente en el último tercio del Sprint 2).
* **Documentación y Bitácora:**
  * `.gitignore`: Ignora `node_modules/`, `.env`, `dist/`, `coverage/`, `playwright-report/`, etc.
  * `README.md`: Completadas secciones de Sprint 1 (se completarán arquitectura, formularios, eventos, pruebas y CI Paso 2 al cerrar Sprint 2).
  * `blog/README.md`: Entrada 1 del Sprint 1.

---

## 5. Estado Actual y Próximos Pasos

* **Rama activa:** `feature/sprint-2-datos-listado` (creada desde `main` tras `v0.1`)
* **Progreso en Trello (17 Nov):**
  * ✅ **Sprint 1 cerrado (Tarjetas 1–12 en «DONE», PR `#2` fusionada en `main` y tag `v0.1`):** Autenticación, roles, avisos, tests unitarios iniciales, CI paso 1 y blog.
  * ✅ **Sprint 2 — Tercio 1 completado (Tarjetas 13–16 en «DONE»):**
    * Validadores de `RegistroPartida` + DNI/NIE módulo 23 + mapa `validadores` (`js/validadores.js`).
    * Almacenamiento por usuario `js/datos/partidas.js` con `id` único y tolerancia a JSON estropeado.
    * Paginación pura `js/paginacion.js`, componente reutilizable `js/componentes/paginacion.js` y listado completo (`listado.html` + `js/paginas/listado.js`) con `<template>`, `textContent`, *debounce*, `URLSearchParams`/`history.replaceState` y `<dialog>`.
    * Tests unitarios (`validadores`, `partidas`, `paginacion`), test de integración de `listado.html` y umbral ≥ 90% en `vitest.config.js`.
  * 📋 **Pendiente de Sprint 2 (Tarjetas 17–23 — 2 tercios restantes):**
    * **Tercio 2 (Tarjetas 17–20):** `ficha.html` completa (alta/edición, campo condicional `hidden`/`disabled`, grupo dinámico `<template>` 1–6 Pokémon, `FormData`/`getAll`, `max` fecha dinámico), `usuarios.html` completa (buscador, paginación reutilizada, cambio de rol sin auto-degradación), y validación en tiempo real accesible en los 3 formularios (`novalidate`, `blur` en captura, `data-validar`, `aria-describedby`, `aria-invalid`, foco al primer error).
    * **Tercio 3 (Tarjetas 21–23):** Tests de integración restantes (`ficha.html` y protección de `usuarios.html`), 2 recorridos E2E en Playwright (`e2e/`), CI Paso 2 (`E2E`, artefactos `coverage/` y `playwright-report/`, `concurrency`, insignia), secciones del `README.md`, entrada del Sprint 2 en `blog/README.md`, PRs a `main` y tag `v0.2`.

---

## 6. Historial de Actualizaciones de Contexto

* **10 Nov 2026:** Creación inicial de `CONTEXTO.md` recogiendo la arquitectura del Sprint 1 hasta la Tarjeta 9, cambio de nombre definitivo a `PokeMemories`, integración del logo `img/logo.png`, unificación de placeholders (`AshKetchum`) y regla de estilo sin puntos finales en frases cortas de la UI.
* **12 Nov 2026:** Cierre de implementación del Sprint 1: limpieza de formato Prettier/ESLint en módulos y tests, creación de `.github/workflows/ci.yml` (Paso 1), entrada del Sprint 1 en `blog/README.md`, actualización de documentación y reflexión en `README.md`, y tarjetas 9–12 movidas a «Hecho» en Trello.
* **12 Nov 2026 (cierre):** Pull Request `#2` (`feature/sprint-1-autenticacion` -> `main`) fusionada con CI en verde, enlace de PR registrado en `README.md` y tag `v0.1` recolocado sobre el cierre real del Sprint 1 en `main`.
* **17 Nov 2026:** Completado el **primer tercio del Sprint 2** en la rama `feature/sprint-2-datos-listado` (Tarjetas 13–16 movidas a `DONE` en Trello): validadores de entidad y DNI/NIE mod 23, `js/datos/partidas.js`, paginación pura y componente DOM/URL, `listado.html` + `js/paginas/listado.js` con `<template>` y `<dialog>`, `js/avisos.js` seguro sin `innerHTML`, tests unitarios + integración de listado y configuración de cobertura ≥ 90% en `vitest.config.js`.
