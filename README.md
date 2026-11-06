# PokeMemories · Salón de la Fama y Álbum de Recuerdos Pokémon

<!-- Sprint 2: la insignia de tu workflow, con tu organización y tu repositorio. -->
![Integración continua](https://github.com/<organización>/<repositorio>/actions/workflows/ci.yml/badge.svg)

<!-- Completa cada sección a medida que avanzas en los sprints. Borra los comentarios como este
     cuando termines. Este README es también la portada de la documentación que genera `npm run docs`.
     No cambies los títulos de las secciones (##): la corrección los busca por su nombre. -->

## Mi proyecto

**PokeMemories** es una aplicación web pensada para entrenadores y aficionados a Pokémon que quieren inmortalizar, registrar y rememorar sus partidas y desafíos completados (ediciones como *HeartGold*, *Esmeralda*, *Platino*, *Rojo Fuego*, etc.).

La aplicación permite registrar cada aventura en el navegador vinculando las horas de juego, la fecha de victoria en la Liga, la licencia oficial de entrenador y el equipo titular de 1 a 6 Pokémon (con sus motes, niveles y ataques insignia). Además, rinde homenaje especial a las **«Leyendas Caídas»**: aquellos Pokémon que no llegaron a la cima de la Liga porque cayeron en batallas épicas a lo largo del camino, pero cuya hazaña merece un lugar de honor en el recuerdo de la partida.

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

### La entidad

| Campo | Control | Obligatorio | Regla de validación | Mensaje si no se cumple |
|-------|---------|:-----------:|---------------------|-------------------------|
| **Código de registro** | Texto | Sí | Expresión regular `^POKE-[A-Z]{3}-\d{4}$` | Formato inválido. Debe ser POKE- seguido de 3 letras de la edición y 4 dígitos (ej. POKE-HGD-0042) |
| **Título de la partida** | Texto | Sí | Longitud entre 3 y 40 caracteres | El título debe tener entre 3 y 40 caracteres |
| **Edición del juego** | Desplegable | Sí | Coincidir con una de las opciones oficiales | Selecciona una edición oficial de la lista |
| **Fecha de victoria** | Fecha | Sí | No puede ser posterior a la fecha actual (`max` dinámico) | La fecha de victoria no puede estar en el futuro |
| **Tiempo de juego** | Texto | Sí | Expresión regular `^\d{1,3}:[0-5]\d$` | Introduce el tiempo en formato Horas:Minutos (ej. 45:30) |
| **Licencia Entrenador (DNI)** | Texto | Sí | Regex `^[XYZ]?\d{7,8}[A-Z]$` + cálculo de control con letra (módulo 23) | La licencia de entrenador (DNI/NIE) o su letra no son válidas |
| **¿Hubo leyendas caídas?** | Casilla | No | Booleano | - |
| **Mención de honor** *(Condicional)* | Texto | Sí (si la casilla está activa) | Longitud entre 10 y 120 caracteres | Explica la hazaña de tu héroe caído (entre 10 y 120 caracteres) |
| **Equipo Pokémon** *(Grupo dinámico)* | Plantilla `<template>` (1 a 6) | Sí | Entre 1 y 6 miembros. Mote (2-20 caracteres), nivel (1-100), estado (Campeón / Leyenda Caída) y movimiento clave | Debes registrar entre 1 y 6 Pokémon en el equipo |

### El registro de usuarios

| Campo | Control | Regla | Mensaje |
|-------|---------|-------|---------|
| **Nombre de usuario** | Texto | Expresión regular `^[a-zA-Z0-9_]{3,15}$` y no estar ya ocupado | El nombre debe tener entre 3 y 15 letras, números o guiones bajos y estar libre |
| **Correo electrónico** | Email | Formato de correo electrónico válido (`type="email"`) | Introduce una dirección de correo electrónico válida |
| **Contraseña** | Contraseña | Mínimo 8 caracteres, al menos una mayúscula (`\p{Lu}`), una minúscula (`\p{Ll}`) y un dígito (`\d`) | Debe tener al menos 8 caracteres, con mayúscula, minúscula y número |
| **Repetir contraseña** | Contraseña | Coincidir exactamente con el campo de contraseña | Las contraseñas no coinciden |
| **Aceptación de condiciones** | Casilla | Casilla obligatoria marcada (`required`) | Debes aceptar las condiciones de uso de PokeMemories |

### Páginas

| Página | Acceso | Qué hace |
|--------|--------|----------|
| `index.html` | Pública | Inicio de sesión de entrenadores con control de doble envío y redirección al listado si ya hay sesión activa |
| `registro.html` | Pública | Registro de nuevos entrenadores con validación en tiempo real de contraseña y sus requisitos visuales |
| `listado.html` | Privada (Usuarios) | Vitrina de recuerdos de partidas con buscador sin tildes/mayúsculas (debounce), paginación y borrado con confirmación en `<dialog>` |
| `ficha.html` | Privada (Usuarios) | Formulario de alta y edición de partidas con campo condicional (leyenda caída) y grupo dinámico de 1 a 6 Pokémon |
| `usuarios.html` | Privada (Solo Administradores) | Panel de administración de entrenadores con buscador, paginación y asignación o retirada de permisos de administrador |

## Arquitectura y módulos

<!-- 1. Un diagrama (Mermaid) de tus módulos y de qué usa cada uno.
     2. Tabla con cada módulo: qué hace, si usa el DOM y qué exporta.
     3. Cómo están hechos tus objetos (funciones fábrica o clases) y qué patrones de diseño usas
        (al menos dos): dónde y por qué.
     4. Cómo reciben las páginas lo que necesitan (almacenamiento, sesión, navegación) y por qué así
        se pueden probar.
     5. Qué documenta tu JSDoc y cómo se genera la documentación (`npm run docs`). -->

## Cómo ejecutarlo

<!-- Cómo abrir el proyecto en el Dev Container y ver la web, y cómo pasar los tests, la cobertura,
     las pruebas de extremo a extremo, ESLint y Prettier, generar la documentación y preparar la web
     publicable (`npm run build`). -->

## Almacenamiento y sesión

<!-- 1. Tabla con cada clave que usas: dónde está (localStorage o sessionStorage), qué guarda y un
        ejemplo de su contenido.
     2. Por qué cada dato va donde va.
     3. Cómo guardas el rol y cómo proteges las páginas por sesión y por rol.
     4. Por qué este inicio de sesión NO es seguro: qué podría hacer alguien con las DevTools y cómo
        se hace en una aplicación real. -->

## Funcionalidad y formularios

<!-- Una subsección por parte de la aplicación (sesión y registro, listado y paginación, ficha,
     zona de administración): qué hace y cómo lo has resuelto. Incluye:
     - cómo lees los datos (FormData: get, getAll), cómo creas y numeras el grupo dinámico, cómo
        funciona el campo condicional, qué atributos pones desde el código y cómo rellenas el
        formulario al editar;
     - la validación: cuándo validas cada campo, de dónde salen los mensajes (validity,
        setCustomValidity y tus validadores), qué haces para que los errores sean accesibles y cómo
        evitas el doble envío;
     - las expresiones regulares: tabla con cada una, en qué validador está, qué acepta (un ejemplo)
        y qué significan sus partes y sus flags; qué parte de la validación hace la expresión y qué
        parte el código. -->

## Eventos

### Eventos en el HTML

<!-- Qué consigues con el HTML sin escribir oyentes (envío con Intro, novalidate y los atributos de
     validación, dialog, label for…) y por qué no usas atributos on…. -->

### Tipos de eventos

<!-- Tabla con los eventos que usas y por qué has elegido cada uno frente a otros parecidos
     (submit frente a click, input frente a change, blur frente a focusout…). -->

### Propagación

<!-- 1. Tabla con TODOS tus oyentes: evento, dónde lo registras, en qué fase actúa
        (captura, objetivo o burbuja) y para qué.
     2. Dónde usas la delegación y qué ganas con ella.
     3. Tu uso de la captura y por qué no servía la burbuja.
     4. Si usas stopPropagation, por qué. -->

## Pruebas y cobertura

<!-- 1. Tabla de la pirámide: tipo (unitario, de integración o de extremo a extremo), fichero,
        qué prueba y cuántos tests tiene. Por qué cada cosa se prueba en ese nivel y no en otro.
     2. Cómo simulas al usuario (eventos, requestSubmit), los servicios (AlmacenFalso, el resumen
        de la contraseña, la navegación) y el tiempo (temporizadores falsos).
     3. Cómo se ejecutan las mismas pruebas de extremo a extremo con serve y contra la web
        desplegada (BASE_URL).
     4. Pega la salida de `npm run coverage` (con el resumen de la cobertura) y de `npm run e2e`.
        Explica qué umbral has puesto, a qué ficheros y qué queda sin probar y por qué. -->

## Integración continua

### ESLint y Prettier

<!-- Sprint 1. Las reglas que has añadido a eslint.config.js (al menos tres): qué comprueba cada una
     y por qué la quieres. Pega la salida de `npm run lint` y de `npm run format:check`. Cuenta un
     problema real que encontraras con el depurador de las DevTools y cómo lo resolviste. -->

### El workflow

<!-- Sprints 1 y 2. Qué hace ci.yml: cuándo se ejecuta, la tabla de sus trabajos y por qué están en
     ese orden, qué artefactos sube y para qué sirven, y qué hace concurrency. -->

| Trabajo | Espera a | Pasos | Artefacto |
|---------|----------|-------|-----------|
| `Calidad` | — | | — |
| `Tests` | | | |
| `E2E` | | | |

**Ejecución en verde con sus artefactos:** <!-- enlace -->

## Despliegue continuo

<!-- Sprint 3. 1. Cómo has configurado Vercel: build, carpeta de salida, protección de los
        despliegues y Deployment Checks (qué comprobaciones exige y por qué).
     2. Qué hacen despliegue.yml y release.yml, y qué comprueba tu prueba de humo.
     3. El camino de un cambio, con tus palabras: desde tu git push en una rama hasta que se ve en
        la web, qué se comprueba en cada paso y qué pasa si algo falla. -->

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

| Evidencia | Enlace | Captura |
|-----------|--------|---------|
| *Pull request* con su vista previa y `E2E desplegado` | <!-- enlace a la pull request --> | `img/pr-comprobaciones.png` |
| Versión retenida por Vercel | <!-- enlace a la ejecución en rojo --> | `img/vercel-retenido.png` |
| Release `v1.0` | <!-- enlace a la Release --> | — |

<!-- Qué rompiste a propósito para la versión retenida, qué viste en Vercel y cómo comprobaste que la
     web seguía con la versión anterior. -->

## Organización del trabajo

### Definición de Hecho

<!-- Sprint 1. Tu lista de condiciones para dar una tarea por terminada. Cada una tiene que poder
     comprobarse. Si la cambias en algún sprint, di qué cambiaste y por qué. -->

- [ ] El código cumple con las reglas configuradas de ESLint sin errores ni avisos (`npm run lint`).
- [ ] El código pasa la comprobación de formato con Prettier (`npm run format:check`).
- [ ] La funcionalidad cuenta con pruebas unitarias o de integración según corresponda en la pirámide de pruebas (`npm test`).
- [ ] Las funciones puras y validadores mantienen el umbral mínimo de cobertura del 90 % (`npm run coverage`).
- [ ] El código está documentado mediante comentarios JSDoc (`@param`, `@returns`, `@fires`, `@listens`).
- [ ] Los cambios se han desarrollado en su propia rama y se integran en `main` mediante una *pull request* con el *workflow* de CI en verde.
- [ ] La tarea asociada en el tablero de Trello se mueve a la columna «Hecho».

### Sprints

<!-- Una fila por sprint. La reflexión: qué salió bien, qué no, qué cambias para el siguiente
     (cuatro o cinco líneas, sobre tu trabajo y no sobre el enunciado). -->

| Sprint | *Tag* | Qué incluye | Reflexión |
|--------|-------|-------------|-----------|
| 1 | `v0.1` | Usuarios, sesión y roles, con sus tests y la primera integración continua (Requisitos 1–12) | <!-- Reflexión al cerrar el sprint 1 --> |
| 2 | `v0.2` | El CRUD, la zona de administración, todas las pruebas y la integración continua completa (Requisitos 13–23) | <!-- Reflexión al cerrar el sprint 2 --> |
| 3 | `v1.0` | Despliegue continuo completo, vistas previas, release de GitHub y entrega final (Requisitos 24–29) | <!-- Reflexión al cerrar el sprint 3 --> |

**Tablero de Trello:** [PokeMemories en Trello](https://trello.com/b/XHNkmnw1/PokeMemories) <!-- compartido con el profesor -->

**Blog del proyecto:** [blog/README.md](blog/README.md) <!-- dificultades y problemas conceptuales de cada sprint -->

### Ramas y versiones

<!-- 1. Tabla con tus ramas: nombre, qué funcionalidad y enlace a su pull request.
     2. Si integras con merge o con rebase, y por qué.
     3. Qué deja fuera tu .gitignore y por qué. -->

| Rama | Funcionalidad | *Pull request* |
|------|---------------|----------------|
| | | |

**Versión de entrega:** `v1.0`
