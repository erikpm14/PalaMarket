# PalaMarket

PalaMarket es una tienda y catálogo interactivo de palas de pádel desarrollado como proyecto final del Máster Full Stack. La aplicación permite explorar una selección de modelos, combinar filtros por marca, forma, nivel, tipo de juego y precio, consultar fichas detalladas y simular una experiencia de compra completa sin backend ni pagos reales.

**Aplicación desplegada:** [https://palamarket.vercel.app](https://palamarket.vercel.app)

**Repositorio:** [https://github.com/erikpm14/PalaMarket](https://github.com/erikpm14/PalaMarket)

## Objetivo

El proyecto reúne en una única aplicación frontend los conceptos trabajados durante el máster: HTML semántico, CSS responsive, JavaScript moderno, componentización, gestión de estado, persistencia local y despliegue. Los datos de partida se han adaptado de `ProyectoPalas`, mientras que la organización de catálogo, favoritos y detalle toma como referencia patrones aprendidos en `Pokemon-kanto`.

## Funcionalidades

- Inicio con presentación, sección de ofertas, selección destacada y guía visual sobre formas de pala.
- Catálogo local de 30 palas reales de Adidas, Babolat, Bullpadel, Head, Nox y StarVie.
- Búsqueda por nombre o marca.
- Filtros combinables por marca, forma, nivel, tipo de juego y rango de precio.
- Ordenación por destacadas, precio, valoración y nombre.
- Dos palas en oferta, con precio anterior y porcentaje de descuento.
- Contador de resultados y estado sin resultados con botón para limpiar filtros.
- Vista de detalle con especificaciones, disponibilidad y modelos relacionados.
- Favoritos persistentes con zona protegida visualmente.
- Carrito lateral con cantidades limitadas por stock, subtotal, envío (gratis desde 300 €) y total.
- Confirmación de compra simulada con SweetAlert2.
- Login y logout simulados.
- Tema claro y oscuro persistente.
- Directorio responsive de tiendas físicas.
- Formulario de contacto con validación en frontend y envío simulado.
- Navegación responsive y menú móvil.
- Estados de foco, hover, vacío, agotado, «quedan pocas unidades», error de formulario y página 404.

## Tecnologías

- Vite
- JavaScript ES Modules
- HTML5 semántico
- CSS con variables, Flexbox y Grid
- SweetAlert2
- localStorage
- ESLint
- Vercel

No se utiliza React, Redux ni backend. Las fichas muestran fotografías de producto enlazadas desde páginas oficiales y distribuidores (ver [Fuentes de imágenes](#fuentes-de-imágenes)); si una imagen falta o no carga se muestra una ilustración neutra de la pala.

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
│   ├── components.css
│   └── pages.css
├── utils/
│   └── format.js
├── views/
│   ├── catalog.js
│   ├── contact.js
│   ├── favorites.js
│   ├── home.js
│   ├── login.js
│   ├── notFound.js
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

`storage.js` centraliza el acceso a `localStorage` con el prefijo `palamarket:` (claves `favorites`, `cart`, `user` y `theme`). Los datos solo viven en el navegador del usuario: no se envían a ningún servidor. Al cargarlos se validan y se descartan los modelos que ya no existen o las cantidades superiores al stock. Si el navegador bloquea el almacenamiento, la aplicación sigue funcionando sin persistencia. Se conservan:

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
- **Fotografías de producto:** cada modelo enlaza su fotografía real (`image`) y la página de procedencia (`imageSource`) en `src/data/products.js`; no se emparejan fotos con modelos distintos.
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

Las fotografías se utilizan **exclusivamente con finalidad académica y no comercial**, para mostrar modelos reales en esta demostración sin ventas. No se reivindica licencia comercial alguna sobre ellas: pertenecen a sus respectivos titulares. La procedencia exacta de cada imagen está en el campo `imageSource` de cada producto en `src/data/products.js`. Las fuentes son:

- [Babolat](https://www.babolat.com/us/padel/racquets.html): los 13 modelos Babolat.
- [NOX](https://www.noxsport.com/): AT10 Genius 18K Alum (2025 y 2026) y AT10 Genius 12K.
- [StarVie](https://starvie.com/): Metheora+.
- [Adidas](https://www.adidas.es/pala-de-padel-metalbone-2026/KL2612.html): Metalbone 2026.
- Distribuidores: [Padel Market](https://padelmarket.com/) (Head y Bullpadel Hack 03), [Paleteros.es](https://paleteros.es/) (Head Extreme Motion), [MegaPadelStore](https://www.megapadel.store/) y [Sur Sports](https://sursports.cl/) (NOX ML10), [Padelvice](https://www.padelvice.com/) (StarVie Triton Pro) y [Padel Island](https://www.padel-island.com/) (StarVie Astrum Eris).
