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
   * Botón accesible «ojo» para mostrar/ocultar contraseña en login y registro (`clave` y `repetir-clave`).
3. **Flujo de trabajo Git:**
   * `main` es producción. Las funcionalidades se desarrollan en ramas (ej. `feature/sprint-1-autenticacion`, `feature/sprint-2-datos-listado`, `feature/sprint-2-ficha-admin-validacion`) y se integran por Pull Request.
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
  * `index.html`: Inicio de sesión con botón «ojo» para contraseña, validación accesible en tiempo real (`novalidate`, `blur` en captura, `aria-describedby`, `aria-invalid`, foco al primer error), bloqueo de doble envío y redirección si ya hay sesión.
  * `registro.html`: Registro de entrenadores con botón «ojo» en ambos campos de clave, indicadores visuales en vivo de los 4 requisitos (`\p{Ll}`, `\p{Lu}`, `\d`, ≥8 caracteres), validación en tiempo real con `data-validar`, comprobación de nombre ocupado y revalidación dependiente de `repetir-clave`.
  * `listado.html`: Vitrina completa de recuerdos con buscador multipalabra con *debounce*, contador de resultados, `<template id="plantilla-partida">`, estado vacío dinámico, controles de paginación y `<dialog id="dialogo-borrar">` nativo.
  * `ficha.html`: Formulario completo de alta (`ficha.html`) y edición (`ficha.html?id=...`) con `max` dinámico en la fecha, campo condicional `Mención de honor` (`hidden` + `disabled`), grupo dinámico `<template id="plantilla-pokemon">` de 1 a 6 Pokémon (ids, `htmlFor` y cajas de error únicos, botones desactivados en límites), lectura con `FormData` (`get` + `getAll`) y validación accesible en tiempo real.
  * `usuarios.html`: Zona de administración protegida para rol `administrador` con buscador con *debounce*, paginación reutilizada, filas desde `<template id="plantilla-usuario">`, delegación para cambiar rol y botón desactivado con explicación en la fila del propio administrador.
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
  * `js/paginacion.js`: Funciones puras `normalizarTextoBusqueda`, `filtrarLista` (multipalabra sin mayúsculas ni tildes) y `paginar(lista, pagina, porPagina)` con corrección de página fuera de rango.
  * `js/componentes/cabecera.js`: `protegerPagina()` (redirección con `location.replace`) y `renderizarCabecera()` con menú condicional para administradores y botón «Cerrar sesión».
  * `js/componentes/paginacion.js`: Renderizado DOM de controles («Anterior», números con `aria-current="page"`, «Siguiente»), delegación de eventos con `closest` y sincronización de `?pagina=` con `URLSearchParams` y `history.replaceState`.
  * `js/componentes/claveVisible.js`: Botón accesible «ojo» (`data-alternar-clave`) con delegación de eventos para mostrar/ocultar contraseñas en `index.html` y `registro.html`.
  * `js/componentes/validacionFormulario.js`: Motor reutilizable de validación en tiempo real y accesible para los 3 formularios (`blur` en fase de captura, `input`/`change` tras el primer foco, revalidación de dependientes, `setCustomValidity` + `validity`, `is-invalid`, `aria-invalid`, `aria-describedby` y foco al primer error).
  * `js/paginas/login.js`, `js/paginas/registro.js`, `js/paginas/listado.js`, `js/paginas/ficha.js` y `js/paginas/usuarios.js`: Controladores completos con inyección de dependencias para pruebas en `happy-dom`.
* **Calidad, CI y Pruebas:**
  * `eslint.config.js`: Reglas añadidas (`no-var`, `prefer-const`, `eqeqeq`, `camelcase`, `no-console`, `no-duplicate-imports`).
  * `vitest.config.js`: Cobertura configurada sobre `js/validadores.js` y `js/paginacion.js` con umbral mínimo del 90% de líneas (actualmente 100%).
  * `tests/unitarios/datos.test.js`, `tests/unitarios/validadores.test.js`, `tests/unitarios/partidas.test.js`, `tests/unitarios/paginacion.test.js`: Batería unitaria completa con `AlmacenFalso` e `it.each`.
  * `tests/integracion/listado.test.js`: Prueba de integración en `happy-dom` (búsqueda con `vi.useFakeTimers()`, paginación con `history.replaceState` y borrado en `<dialog>`).
  * `.github/workflows/ci.yml`: Workflow de GitHub Actions (Paso 1; Paso 2 pendiente en el último tercio del Sprint 2).
* **Entorno Docker local:**
  * Contenedor Dev Container renombrado a `ProyectoIndividualDOM` (`9bedf24262d4`).
  * Contenedor de vista previa `PokeMemories-Web` sirviendo `http://localhost:3901/` desde Docker Desktop.

---

## 5. Estado Actual y Próximos Pasos

* **Rama activa:** `feature/sprint-2-ficha-admin-validacion` (apilada sobre `feature/sprint-2-datos-listado`)
* **Progreso en Trello (17 Nov):**
  * ✅ **Sprint 1 cerrado (Tarjetas 1–12 en «DONE», PR `#2` fusionada en `main` y tag `v0.1`).**
  * ✅ **Sprint 2 — Tercio 1 completado (Tarjetas 13–16 en «DONE»):** Validadores de entidad + DNI mod 23, `partidas.js`, paginación pura + componente DOM/URL, `listado.html` + `listado.js`, tests unitarios + integración listado y cobertura 100%.
  * ✅ **Sprint 2 — Tercio 2 completado (Tarjetas 17–20 en «DONE»):**
    * `ficha.html` + `js/paginas/ficha.js` (alta y edición `?id=...`, `max` fecha dinámico, campo condicional `hidden`/`disabled`, grupo dinámico `<template>` 1–6 Pokémon con delegación y `FormData.getAll`).
    * `usuarios.html` + `js/paginas/usuarios.js` (protección solo admin, buscador, paginación reutilizada, cambio de rol por delegación y bloqueo de auto-degradación con explicación).
    * `js/componentes/validacionFormulario.js` aplicado a los 3 formularios (`index.html`, `registro.html`, `ficha.html`) con `blur` en fase de captura, `data-validar`, `setCustomValidity`, `aria-describedby`, `aria-invalid`, `is-invalid` y foco al primer error.
  * 📋 **Pendiente de Sprint 2 — Tercio 3 final (Tarjetas 21–23):**
    * **Tarjeta 21:** Tests de integración restantes (`tests/integracion/ficha.test.js` y `tests/integracion/usuarios.test.js` — protección por rol y administración) + 2 recorridos E2E en Playwright (`e2e/sesion.spec.js` y `e2e/crud.spec.js` con helpers compartidos).
    * **Tarjeta 22:** CI Paso 2 en `.github/workflows/ci.yml` (`Tests` con `npm run coverage` + artefacto `coverage/`, trabajo `E2E` con Chromium + artefacto `playwright-report/` en `if: failure()`, `concurrency` con `cancel-in-progress: true` e insignia en `README.md`).
    * **Tarjeta 23:** Completar secciones del `README.md` (Arquitectura, Almacenamiento, Formularios/Regex, Eventos, Pruebas/Cobertura, CI Paso 2, Reflexión Sprint 2), entrada del Sprint 2 en `blog/README.md`, fusión por Pull Request en `main` y creación del tag `v0.2`.

---

## 6. Historial de Actualizaciones de Contexto

* **10 Nov 2026:** Creación inicial de `CONTEXTO.md` recogiendo la arquitectura del Sprint 1 hasta la Tarjeta 9, cambio de nombre definitivo a `PokeMemories`, integración del logo `img/logo.png`, unificación de placeholders (`AshKetchum`) y regla de estilo sin puntos finales en frases cortas de la UI.
* **12 Nov 2026:** Cierre de implementación del Sprint 1: limpieza de formato Prettier/ESLint en módulos y tests, creación de `.github/workflows/ci.yml` (Paso 1), entrada del Sprint 1 en `blog/README.md`, actualización de documentación y reflexión en `README.md`, y tarjetas 9–12 movidas a «Hecho» en Trello.
* **12 Nov 2026 (cierre):** Pull Request `#2` (`feature/sprint-1-autenticacion` -> `main`) fusionada con CI en verde, enlace de PR registrado en `README.md` y tag `v0.1` recolocado sobre el cierre real del Sprint 1 en `main`.
* **17 Nov 2026:** Completado el **primer tercio del Sprint 2** en la rama `feature/sprint-2-datos-listado` (Tarjetas 13–16 movidas a `DONE` en Trello): validadores de entidad y DNI/NIE mod 23, `js/datos/partidas.js`, paginación pura y componente DOM/URL, `listado.html` + `js/paginas/listado.js` con `<template>` y `<dialog>`, `js/avisos.js` seguro sin `innerHTML`, tests unitarios + integración de listado y configuración de cobertura ≥ 90% en `vitest.config.js`.
* **17 Nov 2026 (UX):** Añadido botón accesible «ojo» para mostrar/ocultar contraseñas en `index.html` y `registro.html` mediante el componente reutilizable `js/componentes/claveVisible.js` con delegación de eventos. Contenedor renombrado a `ProyectoIndividualDOM` y vista previa desplegada en Docker Desktop (`PokeMemories-Web`, puerto `3901`).
* **17 Nov 2026 (Tercio 2):** Completado el **segundo tercio del Sprint 2** en `feature/sprint-2-ficha-admin-validacion` (Tarjetas 17–20 movidas a `DONE` en Trello): `ficha.html` + `ficha.js` (alta/edición, campo condicional `hidden`/`disabled`, grupo dinámico 1–6 `<template>`, `FormData.getAll`), `usuarios.html` + `usuarios.js` (zona admin completa con protección contra auto-degradación) y motor reutilizable `validacionFormulario.js` con `blur` en captura y accesibilidad completa en los 3 formularios.
* **17 Nov 2026 (Mejora Leyendas Caídas):** Rediseñada la sección condicional «¿Hubo leyendas caídas durante la aventura?» al estilo del equipo Pokémon: al activarla desbloquea un bloque dorado condicional (`hidden` + `disabled` cuando está desmarcada) que permite añadir de 1 a 6 Pokémon caídos (mote, nivel al caer y hazaña/recuerdo) desde `<template id="plantilla-leyenda-caida">`, mostrándolos también con homenaje propio en cada tarjeta de `listado.html`.
* **17 Nov 2026 (ID de Entrenador):** Sustituido el campo «Licencia de Entrenador (DNI/NIE)» por **ID de Entrenador** (`^\d{5}-\d$` + dígito de control en código = suma de los 5 dígitos módulo 10, ej. `00151-7`), 100% temático Pokémon y cumpliendo igualmente la regla de control del Requisito 13.
