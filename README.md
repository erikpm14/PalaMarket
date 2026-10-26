# PalaMarket

PalaMarket es una tienda y catálogo interactivo de palas de pádel desarrollado como proyecto final del Máster Full Stack. La aplicación permite explorar una selección de modelos, combinar filtros por marca, forma, nivel, tipo de juego y precio, consultar fichas detalladas y simular una experiencia de compra completa sin backend ni pagos reales.

**Aplicación desplegada:** [https://palamarket.vercel.app](https://palamarket.vercel.app)

## Objetivo

El proyecto reúne en una única aplicación frontend los conceptos trabajados durante el máster: HTML semántico, CSS responsive, JavaScript moderno, componentización, gestión de estado, persistencia local y despliegue. Los datos de partida se han adaptado de `ProyectoPalas`, mientras que la organización de catálogo, favoritos y detalle toma como referencia patrones aprendidos en `Pokemon-kanto`.

## Funcionalidades

- Inicio con presentación, selección destacada y guía visual sobre formas de pala.
- Catálogo local de 30 palas reales de Adidas, Babolat, Bullpadel, Head, Nox y StarVie.
- Búsqueda por nombre o marca.
- Filtros combinables por marca, forma, nivel y rango de precio.
- Ordenación por precio, nombre y valoración.
- Contador de resultados y estado vacío.
- Vista de detalle con especificaciones, disponibilidad y modelos relacionados.
- Favoritos persistentes con zona protegida visualmente.
- Carrito lateral con cantidades, subtotales, envío y total.
- Confirmación de compra simulada con SweetAlert2.
- Login y logout simulados.
- Tema claro y oscuro persistente.
- Directorio responsive de tiendas físicas.
- Formulario de contacto con validación en frontend y envío simulado.
- Navegación responsive y menú móvil.
- Estados de foco, vacío, agotado y error de formulario.

## Tecnologías

- Vite
- JavaScript ES Modules
- HTML5 semántico
- CSS con variables, Flexbox y Grid
- SweetAlert2
- localStorage
- ESLint
- Vercel

No se utiliza React, Redux ni backend. Las fichas muestran fotografías de producto enlazadas desde catálogos oficiales y distribuidores, con fallback CSS preparado para futuras referencias.

## Estructura

```text
src/
├── components/
│   ├── cart/
│   ├── layout/
│   ├── products/
│   ├── stores/
│   └── ui/
├── data/
│   ├── products.js
│   └── stores.js
├── services/
│   └── storage.js
├── state/
│   └── appState.js
├── styles/
│   ├── variables.css
│   ├── reset.css
│   ├── global.css
│   ├── layout.css
│   └── components.css
├── views/
│   ├── catalog.js
│   ├── contact.js
│   ├── favorites.js
│   ├── home.js
│   ├── login.js
│   ├── product.js
│   └── stores.js
├── main.js
└── router.js
```

## Instalación

Requisitos: Node.js 20.19 o superior y npm.

```bash
git clone https://github.com/erikpm14/PalaMarket.git
cd PalaMarket
npm install
npm run dev
```

Vite mostrará la dirección local de desarrollo en la terminal.

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # genera la versión de producción en dist/
npm run preview  # previsualiza la compilación
npm run lint     # analiza el código con ESLint
```

## Uso

Desde el catálogo se pueden combinar todos los filtros y abrir la ficha de cualquier modelo. Los botones con forma de corazón guardan o eliminan favoritos. El botón “Añadir” incorpora una unidad al carrito; desde el panel lateral se pueden ajustar cantidades, eliminar líneas o vaciar la selección.

### Persistencia

`storage.js` centraliza el acceso a localStorage con el prefijo `palamarket:`. Se conservan:

- productos favoritos;
- contenido del carrito;
- usuario simulado;
- preferencia de tema.

### Autenticación simulada

El formulario de acceso no se conecta a un servidor, no crea una cuenta real y no solicita contraseña. Solo guarda nombre y email en el localStorage del navegador para demostrar un flujo de sesión académico. La vista de favoritos pide iniciar sesión, aunque la selección permanece guardada localmente.

### Compra y contacto simulados

El proceso de compra no procesa pagos ni transmite datos. El formulario de contacto valida la información en el navegador, muestra una confirmación y descarta el contenido.

## Despliegue

El proyecto está desplegado en Vercel y preparado mediante `vercel.json`:

- framework: Vite;
- comando de build: `npm run build`;
- directorio de publicación: `dist`;
- reescritura de respaldo a `index.html`.

La carpeta local `.vercel` está excluida de Git y no se requiere ninguna variable de entorno.

## Decisiones técnicas

- **JavaScript vanilla:** mantiene el alcance académico y hace visibles el enrutado, el estado y la renderización sin abstracciones de framework.
- **Hash router:** permite rutas propias para el detalle sin depender de configuración de servidor durante el desarrollo.
- **Estado observable centralizado:** `appState.js` coordina carrito, favoritos, usuario y tema, y notifica a la interfaz después de cada cambio.
- **Datos locales separados:** el catálogo y las tiendas viven en módulos independientes y pueden sustituirse por una API en el futuro.
- **Fotografías de producto:** el catálogo usa imágenes reales de las páginas de Adidas, Head, StarVie, Babolat, NOX y Paleteros.es; se mantienen las fuentes en los datos para documentar su procedencia.
- **Diseño accesible:** landmarks semánticos, etiquetas visibles, navegación por teclado, foco perceptible, botones con nombre accesible y respeto por `prefers-reduced-motion`.

## Mejoras futuras

- Comparador de dos o tres palas.
- Historial de productos vistos.
- Tests unitarios y end-to-end integrados en CI.
- Datos de stock conectados a una API real.
- Panel de administración y autenticación real si el alcance incorporase backend.
- Preferencias de accesibilidad adicionales.

## Autor

Erik Portillo Modrego


## Fuentes de imágenes

Las fotografías se utilizan únicamente para presentar modelos reales en este proyecto académico sin venta ni uso comercial. Proceden de las páginas de producto de [Adidas](https://www.adidas.es/pala-de-padel-metalbone-2026/KL2612.html), [Head](https://www.head.com/es_ES/product/extreme-pro-2025-223125), [StarVie](https://starvie.com/products/pala-metheora), [Babolat](https://www.babolat.com/es/padel-technical-collection-2026.html), [NOX](https://noxsport.com/products/pala-at10-genius-18k-alum-2026-by-agustin-tapia) y [Paleteros.es](https://paleteros.es/padel/pala-bullpadel-hack-03-2024/).
