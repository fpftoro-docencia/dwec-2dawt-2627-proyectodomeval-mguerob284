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
   * `main` es producción. Las funcionalidades se desarrollan en ramas (ej. `feature/sprint-1-autenticacion`) y se integran por Pull Request.
   * No borrar ramas tras fusionarlas.

---

## 3. Planificación, Fechas y Gestión

* **Repositorio:** `https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-mguerob284`
* **Tablero de Trello:** [PokéMemories en Trello](https://trello.com/b/XHNkmnw1/pokememories)
  * Columnas: `Por hacer`, `Haciendo`, `Hecho`
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
  * `listado.html`: Vitrina privada (esqueleto protegido con cabecera común).
  * `ficha.html`: Formulario de partida privado (esqueleto protegido con cabecera común).
  * `usuarios.html`: Zona de administración protegida para rol `administrador` (expulsa con aviso de error si entra un usuario normal).
* **Estilos e Imágenes:**
  * `css/estilos.css`: Estilos de apoyo a Bootstrap (cabecera, animación sutil en el logo al hacer hover, clases `.cumplido` / `.pendiente` para requisitos de clave).
  * `img/logo.png`: Logo oficial de PokeMemories.
* **Módulos JS (`js/`):**
  * `js/clave.js`: Hash SHA-256 asíncrono `resumirClave` (archivo original del profesor, **no modificar**).
  * `js/datos/usuarios.js`: CRUD básico de usuarios en `localStorage` (`pokememories_usuarios`). El primer usuario registrado es `administrador`, los siguientes `usuario`. Lecturas tolerantes a JSON corrupto.
  * `js/datos/sesion.js`: Gestión de sesión activa en `sessionStorage` (`pokememories_sesion`). Tolerante a datos corruptos.
  * `js/avisos.js`: Emisión de evento propio `CustomEvent('aviso', { bubbles: true, detail })`, oyente único en `document` con alertas Bootstrap y soporte de avisos diferidos entre páginas (`pokememories_aviso_pendiente`).
  * `js/validadores.js`: Funciones puras para validar nombre de usuario (`^[a-zA-Z0-9_]{3,15}$`), correo electrónico, análisis de requisitos de contraseña y repetición de contraseña.
  * `js/componentes/cabecera.js`: `protegerPagina()` (redirección con `location.replace`) y `renderizarCabecera()` con menú condicional para administradores y botón «Cerrar sesión».
  * `js/paginas/login.js` y `js/paginas/registro.js`: Controladores con inyección de dependencias para facilitar testing.
* **Calidad y Pruebas:**
  * `eslint.config.js`: Reglas añadidas (`no-var`, `prefer-const`, `eqeqeq`, `camelcase`, `no-console`, `no-duplicate-imports`).
  * `tests/unitarios/datos.test.js`: Pruebas de usuarios y sesión usando `AlmacenFalso`.
  * `tests/unitarios/validadores.test.js`: Pruebas unitarias con tablas `it.each` (límites y casos inválidos).
* **Infraestructura local:**
  * `.gitignore`: Ignora `node_modules/`, `.env`, `dist/`, `coverage/`, `playwright-report/`, etc.
  * `README.md`: Completada la sección `## Mi proyecto`, tablas de la entidad/usuarios/páginas, Definición de Hecho y enlace a Trello.

---

## 5. Estado Actual y Próximos Pasos

* **Rama activa:** `feature/sprint-1-autenticacion`
* **Progreso en Trello (a fecha 10 Nov):**
  * ✅ **Hecho (Tarjetas 1–8):** Organización inicial, estructura de las 5 páginas, módulos de datos/roles, login, registro, protección de páginas y sistema de avisos.
  * 🔄 **Haciendo (Tarjeta 9):** Calidad (`eslint.config.js` configurado; falta documentar las reglas en `README.md` y verificar `npm run lint` / `format:check`).
  * 📋 **Por hacer para cerrar Sprint 1 (Tarjetas 10–12):**
    1. Verificar los tests unitarios en el contenedor (`npm test`) y completar documentación de ESLint en README.
    2. Crear `.github/workflows/ci.yml` (Paso 1: trabajos `Calidad` y `Tests`).
    3. Escribir la entrada del Sprint 1 en `blog/README.md`, completar reflexión en `README.md`, abrir PR, fusionar en `main` y crear el tag `v0.1`.

### Diseño pendiente de la entidad para Sprint 2 (`RegistroPartida`)
* **Campos mínimos:** Código de registro (`^POKE-[A-Z]{3}-\d{4}$`), Título de partida (3–40 chars), Edición del juego (select), Fecha de victoria (date con `max` hoy), Tiempo de juego (`^\d{1,3}:[0-5]\d$`), Licencia Entrenador DNI/NIE (`^[XYZ]?\d{7,8}[A-Z]$` + validación matemática módulo 23).
* **Campo condicional:** Checkbox *«¿Hubo leyendas caídas?»* -> habilita/muestra (`hidden` + `disabled`) *«Mención de honor»* (10–120 chars).
* **Grupo dinámico (`<template>`, 1 a 6 miembros):** Mote/Especie, Nivel (1–100), Estado (`Campeón` / `Leyenda Caída`), Movimiento clave.

---

## 6. Historial de Actualizaciones de Contexto

* **10 Nov 2026:** Creación inicial de `CONTEXTO.md` recogiendo la arquitectura del Sprint 1 hasta la Tarjeta 9, cambio de nombre definitivo a `PokeMemories`, integración del logo `img/logo.png`, unificación de placeholders (`AshKetchum`) y regla de estilo sin puntos finales en frases cortas de la UI.
