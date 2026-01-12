# Empezando

<audio id="vite-audio">
  <source src="/vite.mp3" type="audio/mpeg">
</audio>

## Vista General

Vite (palabra francesa que significa "rápido", se pronuncia `/viːt/`<button style="border:none;padding:3px;border-radius:4px;vertical-align:bottom" id="play-vite-audio" aria-label="pronunciar" onclick="document.getElementById('vite-audio').play();"><svg style="height:2em;width:2em"><use href="../images/voice.svg?no-inline#voice" /></svg></button>, como "veet") es una herramienta de build que busca dar una experiencia de desarrollo más rápida y ligera para proyectos web modernos. Consiste de dos partes principales:

- Un servidor de desarrollo que ofrece [mejoras increíbles](./features) sobre [módulos ES nativos](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Modules), por ejemplo un [Hot Module Replacement (HMR)](./features#hot-module-replacement) super rápido.

- Un comando de build que empaqueta tu código con [Rollup](https://rollupjs.org), preconfigurado para generar assets estáticos altamente optimizados para producción.

Vite viene con opiniones y defaults sensatos listos para usar. Lee sobre lo que es posible hacer en la [Guía de Características](./features). El soporte para frameworks o integración con otras herramientas es posible a través de [Plugins](./using-plugins). La [Sección de Configuración](../config/) explica cómo adaptar Vite a tu proyecto si es necesario.

Vite también es altamente extensible mediante su [API de Plugins](./api-plugin) y [API de JavaScript](./api-javascript) con soporte completo de tipado.

Puedes aprender más sobre la razón de ser del proyecto en la sección [Por qué Vite](./why).

## Soporte de Navegadores

Durante el desarrollo, Vite asume que estás usando un navegador moderno. Esto significa que el navegador soporta la mayoría de las características más recientes de JavaScript y CSS. Por esta razón, Vite establece [`esnext` como target de transformación](https://esbuild.github.io/api/#target). Esto previene la transformación de sintaxis, dejando que Vite sirva módulos lo más cercano posible al código fuente original. Vite inyecta algo de código en runtime para hacer funcionar el servidor de desarrollo. Este código usa características incluidas en [Baseline](https://web-platform-dx.github.io/web-features/) Newly Available al momento de cada release mayor (2026-01-01 para esta versión mayor).

Para builds de producción, Vite por defecto apunta a navegadores [Baseline](https://web-platform-dx.github.io/web-features/) Widely Available. Estos son navegadores que fueron lanzados hace al menos 2.5 años. El target puede ser bajado mediante configuración. Adicionalmente, navegadores legacy pueden ser soportados mediante el plugin oficial [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy). Ve la sección [Building for Production](./build) para más detalles.

## Probando Vite en Línea

Puedes probar Vite online en [StackBlitz](https://vite.new/). Ejecuta el setup de build basado en Vite directamente en el navegador, así que es casi idéntico al setup local pero no requiere instalar nada en tu máquina. Puedes navegar a `vite.new/{template}` para seleccionar qué framework usar.

Los templates soportados son:

|             JavaScript              |                TypeScript                 |
| :---------------------------------: | :---------------------------------------: |
| [vanilla](https://vite.new/vanilla) | [vanilla-ts](https://vite.new/vanilla-ts) |
|     [vue](https://vite.new/vue)     |     [vue-ts](https://vite.new/vue-ts)     |
|   [react](https://vite.new/react)   |   [react-ts](https://vite.new/react-ts)   |
|  [preact](https://vite.new/preact)  |  [preact-ts](https://vite.new/preact-ts)  |
|     [lit](https://vite.new/lit)     |     [lit-ts](https://vite.new/lit-ts)     |
|  [svelte](https://vite.new/svelte)  |  [svelte-ts](https://vite.new/svelte-ts)  |
|   [solid](https://vite.new/solid)   |   [solid-ts](https://vite.new/solid-ts)   |
|    [qwik](https://vite.new/qwik)    |    [qwik-ts](https://vite.new/qwik-ts)    |

## Creando Tu Primer Proyecto Vite

::: code-group

```bash [npm]
$ npm create vite@latest
```

```bash [Yarn]
$ yarn create vite
```

```bash [pnpm]
$ pnpm create vite
```

```bash [Bun]
$ bun create vite
```

:::

Luego sigue las instrucciones!

También puedes especificar directamente el nombre del proyecto y el template que quieres usar mediante opciones adicionales de línea de comandos. Por ejemplo, para crear un proyecto Vite + Vue, ejecuta:

::: code-group

```bash [npm]
# npm 7+, el doble guión extra es necesario:
$ npm create vite@latest my-vue-app -- --template vue

# npm 6.x
$ npm create vite@latest my-vue-app --template vue
```

```bash [Yarn]
$ yarn create vite my-vue-app --template vue
```

```bash [pnpm]
$ pnpm create vite my-vue-app --template vue
```

```bash [Bun]
$ bun create vite my-vue-app --template vue
```

:::

Ve [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite) para más detalles sobre cada template soportado: `vanilla`, `vanilla-ts`, `vue`, `vue-ts`, `react`, `react-ts`, `react-swc`, `react-swc-ts`, `preact`, `preact-ts`, `lit`, `lit-ts`, `svelte`, `svelte-ts`, `solid`, `solid-ts`, `qwik`, `qwik-ts`.

Puedes usar `.` como nombre de proyecto para crear el scaffold en el directorio actual.

## Templates de la Comunidad

create-vite es una herramienta para iniciar rápidamente un proyecto desde un template básico para frameworks populares. Revisa Awesome Vite para [templates mantenidos por la comunidad](https://github.com/vitejs/awesome-vite#templates) que incluyen otras herramientas o apuntan a diferentes frameworks.

Para un template en `https://github.com/user/project`, puedes probarlo online usando `https://github.stackblitz.com/user/project` (agregando `.stackblitz` después de `github` al URL del proyecto).

También puedes usar una herramienta como [degit](https://github.com/Rich-Harris/degit) para crear tu proyecto desde uno de los templates. Asumiendo que el proyecto está en GitHub y usa `main` como rama default, puedes crear una copia local usando:

```bash
npx degit user/project#main my-project
cd my-project

npm install
npm run dev
```

## Instalación Manual

En tu proyecto, puedes instalar el CLI de `vite` usando:

::: code-group

```bash [npm]
$ npm install -D vite
```

```bash [Yarn]
$ yarn add -D vite
```

```bash [pnpm]
$ pnpm add -D vite
```

```bash [Bun]
$ bun add -D vite
```

:::

Y crear un archivo `index.html` así:

```html
<p>¡Hola Vite!</p>
```

Luego ejecuta el CLI de `vite` en tu terminal:

```bash
vite
```

El `index.html` se servirá en `http://localhost:5173`.

## `index.html` y la Raíz del Proyecto

Una cosa que quizás notaste es que en un proyecto Vite, `index.html` está al frente y centro en lugar de estar escondido dentro de `public`. Esto es intencional: durante el desarrollo Vite es un servidor, y `index.html` es el punto de entrada a tu aplicación.

Vite trata `index.html` como código fuente y parte del grafo de módulos. Resuelve `<script type="module" src="...">` que referencia tu código fuente JavaScript. Incluso el `<script type="module">` inline y CSS referenciado mediante `<link href>` también disfrutan de características específicas de Vite. Además, los URLs dentro de `index.html` son automáticamente rebasados así que no hay necesidad de placeholders especiales como `%PUBLIC_URL%`.

Similar a servidores http estáticos, Vite tiene el concepto de un "directorio raíz" desde el cual se sirven tus archivos. Lo verás referenciado como `<root>` a lo largo del resto de la documentación. Los paths absolutos en tu código fuente serán resueltos usando la raíz del proyecto como base, así que puedes escribir código como si estuvieras trabajando con un servidor de archivos estático normal (¡excepto que es mucho más poderoso!). Vite también es capaz de manejar dependencias que se resuelven a ubicaciones fuera del sistema de archivos raíz, lo que lo hace útil incluso en un setup basado en monorepo.

Vite también soporta [aplicaciones multi-página](./build#multi-page-app) con múltiples puntos de entrada `.html`.

#### Especificando una Raíz Alternativa

Ejecutar `vite` inicia el servidor de desarrollo usando el directorio actual como raíz. Puedes especificar una raíz alternativa con `vite serve some/sub/dir`.
Ten en cuenta que Vite también resolverá [su archivo de configuración (ej. `vite.config.js`)](/config/#configuring-vite) dentro de la raíz del proyecto, así que necesitarás moverlo si la raíz cambia.

## Interfaz de Línea de Comandos

En un proyecto donde Vite está instalado, puedes usar el binario `vite` en tus scripts npm, o ejecutarlo directamente con `npx vite`. Aquí están los scripts npm por defecto en un proyecto Vite creado con scaffold:

```json [package.json]
{
  "scripts": {
    "dev": "vite", // inicia el servidor de desarrollo, aliases: `vite dev`, `vite serve`
    "build": "vite build", // build para producción
    "preview": "vite preview" // preview local del build de producción
  }
}
```

Puedes especificar opciones CLI adicionales como `--port` o `--open`. Para una lista completa de opciones CLI, ejecuta `npx vite --help` en tu proyecto.

Aprende más sobre la [Interfaz de Línea de Comandos](./cli.md)

## Usando Versiones No Lanzadas

Si no puedes esperar por un nuevo release para probar las últimas características, necesitarás clonar el [repositorio de vite](https://github.com/vitejs/vite) a tu máquina local y luego hacer el build y link tu mismo ([pnpm](https://pnpm.io/) es requerido):

```bash
git clone https://github.com/vitejs/vite.git
cd vite
pnpm install
cd packages/vite
pnpm run build
pnpm link --global # usa tu gestor de paquetes preferido para este paso
```

Luego ve a tu proyecto basado en Vite y ejecuta `pnpm link --global vite` (o el gestor de paquetes que usaste para linkear globalmente `vite`). ¡Ahora reinicia el servidor de desarrollo para ir en el filo de la navaja!

## Comunidad

Si tienes preguntas o necesitas ayuda, contacta a la comunidad en [Discord](https://chat.vite.dev) y en [GitHub Discussions](https://github.com/vitejs/vite/discussions).
