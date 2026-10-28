# PalaMarket

PalaMarket es una tienda y catálogo interactivo de palas de pádel desarrollado como proyecto final del Máster Full Stack. Permite explorar una selección de modelos, combinar filtros por marca, forma, nivel, tipo de juego y precio, consultar fichas detalladas y crear una cuenta para guardar favoritos y carrito en un backend propio. La compra y el formulario de contacto son simulados: no hay pagos reales.

**Aplicación desplegada:** [https://palamarket.vercel.app](https://palamarket.vercel.app)

**Repositorio:** [https://github.com/erikpm14/PalaMarket](https://github.com/erikpm14/PalaMarket)

## Objetivo

El proyecto reúne en una única aplicación los conceptos trabajados durante el máster: HTML semántico, CSS responsive, JavaScript moderno, componentización, gestión de estado, API REST con Node.js y Express, base de datos MongoDB, autenticación con JWT, seguridad y despliegue. El backend parte de la base tecnológica de `ProyectoPalas` (Express, MongoDB con Mongoose, bcrypt y JWT), reescrita para este proyecto con cookies `httpOnly`, validación de entradas, límites de peticiones y datos privados por usuario.

## Funcionalidades

- Inicio con presentación, sección de ofertas, selección destacada y guía visual sobre formas de pala.
- Catálogo local de 30 palas reales de Adidas, Babolat, Bullpadel, Head, Nox y StarVie.
- Búsqueda por nombre o marca.
- Filtros combinables por marca, forma, nivel, tipo de juego y rango de precio.
- Ordenación por destacadas, precio, valoración y nombre.
- Dos palas en oferta, con precio anterior y porcentaje de descuento.
- Contador de resultados y estado sin resultados con botón para limpiar filtros.
- Vista de detalle con especificaciones, disponibilidad y modelos relacionados.
- **Registro, inicio y cierre de sesión reales**, con errores claros por campo y estados de carga.
- **Favoritos y carrito por usuario**, guardados en el servidor y recuperables en cualquier dispositivo.
- Al iniciar sesión, los favoritos y el carrito guardados como anónimo se añaden a la cuenta.
- Sin cuenta, la tienda funciona igual: favoritos y carrito se guardan en el dispositivo.
- Si la API no está disponible se muestra un aviso con botón «Reintentar» y la tienda sigue usable.
- Carrito lateral con cantidades limitadas por stock, subtotal, envío (gratis desde 300 €) y total.
- Confirmación de compra simulada con SweetAlert2.
- Tema claro y oscuro persistente.
- Directorio responsive de tiendas físicas.
- Formulario de contacto con validación en frontend y envío simulado.
- Navegación responsive y menú móvil.
- Estados de foco, hover, carga, vacío, agotado, «quedan pocas unidades», error de formulario y página 404.

## Tecnologías

**Frontend:** Vite, JavaScript (módulos ES), HTML5 semántico, CSS con variables, Flexbox y Grid, SweetAlert2.

**Backend:** Node.js, Express 5, MongoDB con Mongoose, bcrypt, JSON Web Tokens, Zod (validación), Helmet, CORS, express-rate-limit y cookie-parser.

**Calidad y despliegue:** ESLint, `node:test` con Supertest y MongoDB en memoria, Vercel (frontend y función serverless) y MongoDB Atlas.

No se utiliza React ni Redux.

## Arquitectura

```text
Navegador ──► Vercel ─┬─ /            → frontend estático (Vite, carpeta dist)
                      └─ /api/*       → función serverless (api/index.js → server/)
                                              │
                                              └─► MongoDB Atlas
```

El backend vive dentro del repositorio (`server/`) y se publica como función de Vercel **en el mismo dominio que la web**. Es la opción recomendada porque la sesión viaja en una cookie `httpOnly` con `SameSite=Lax`: no hay peticiones entre sitios, no depende de cookies de terceros (bloqueadas por muchos navegadores) y no necesita abrir CORS. En desarrollo, Vite reenvía `/api` al servidor local para conservar el mismo origen.

También puede ejecutarse como servicio independiente (Render, Railway…) con `npm run server`; en ese caso hay que definir `CORS_ORIGINS` con el dominio de la web y `COOKIE_SAME_SITE=none` (la cookie pasa a ser `Secure`) y indicar la URL de la API en la variable `VITE_API_URL` al compilar el frontend.

El catálogo sigue siendo una fuente única de verdad en `src/data/products.js`: el servidor lo importa para validar identificadores y stock.

## Estructura

```text
.
├── api/
│   └── index.js              # entrada de la función serverless de Vercel
├── server/
│   ├── src/
│   │   ├── config/           # variables de entorno y conexión a MongoDB
│   │   ├── controllers/      # auth, favoritos y carrito
│   │   ├── middleware/       # autenticación, validación, seguridad y errores
│   │   ├── models/           # modelo User
│   │   ├── routes/           # rutas de la API
│   │   ├── utils/            # sesión (JWT y cookies), catálogo y errores
│   │   ├── app.js            # aplicación Express
│   │   └── server.js         # arranque como servicio independiente
│   ├── tests/                # pruebas de la API
│   ├── .env.example
│   └── package.json
├── src/                      # frontend
│   ├── components/ (cart, layout, products, stores, ui)
│   ├── data/                 # catálogo y tiendas
│   ├── services/             # api.js (cliente HTTP) y storage.js
│   ├── state/                # appState.js
│   ├── styles/
│   ├── utils/
│   ├── views/
│   ├── main.js
│   └── router.js
├── vercel.json
└── package.json              # workspaces: server
```

## Instalación en local

Requisitos: Node.js 22 (el proyecto exige `22.x`; Vite 7 necesita como mínimo la 20.19), npm y una base de datos MongoDB (local, Docker o Atlas).

```bash
git clone https://github.com/erikpm14/PalaMarket.git
cd PalaMarket
npm install
```

1. **Base de datos.** Con Docker (tiene que estar en marcha Docker Desktop):

   ```bash
   docker run -d --name palamarket-mongo -p 27017:27017 mongo:8
   ```

   La cadena de conexión será `mongodb://127.0.0.1:27017/palamarket`. Para parar y volver a arrancar el contenedor más adelante: `docker stop palamarket-mongo` y `docker start palamarket-mongo`. También sirve una cadena de conexión de MongoDB Atlas o una instalación local de MongoDB.
2. **Variables del servidor.** Copia `server/.env.example` a `server/.env` y rellénalo (ver tabla). Para generar el secreto de sesión:
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
3. **Arranque** (dos terminales):

```bash
npm run server:dev   # API en http://localhost:4000
npm run dev          # frontend en http://localhost:5173 (reenvía /api al servidor)
```

Abre `http://localhost:5173`. Si el servidor no está en marcha, la tienda sigue funcionando sin cuenta y se muestra un aviso.

## Variables de entorno

Se definen en `server/.env` (local) o en el panel de Vercel (producción). **Nunca se suben a Git**: `.env` está en `.gitignore` y solo se versiona `server/.env.example`, sin secretos.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MONGODB_URI` | Sí | Cadena de conexión de MongoDB. |
| `JWT_SECRET` | Sí | Secreto para firmar la sesión (mínimo 32 caracteres aleatorios). |
| `CORS_ORIGINS` | Sí en producción | Orígenes de la web permitidos, separados por comas (p. ej. `https://palamarket.vercel.app`). En local: `http://localhost:5173`. |
| `PORT` | No | Puerto del servidor local (por defecto 4000). |
| `JWT_EXPIRES_IN` | No | Duración del token (por defecto `7d`). |
| `COOKIE_MAX_AGE_DAYS` | No | Duración de la cookie en días (por defecto 7). |
| `COOKIE_SAME_SITE` | No | `lax` (por defecto), `strict` o `none` (backend en otro dominio). |
| `TRUST_PROXY` | No | Número de proxies delante de la API (por defecto 1 en producción). |
| `AUTH_RATE_LIMIT_MAX` | No | Intentos de registro/login por IP cada 15 minutos (por defecto 10). |
| `API_RATE_LIMIT_MAX` | No | Peticiones por IP cada 15 minutos (por defecto 300). |
| `DB_TIMEOUT_MS` | No | Tiempo máximo para conectar con la base de datos (por defecto 8000). |
| `VITE_API_URL` | No (frontend) | URL de la API si no está en el mismo dominio (por defecto `/api`). |

El servidor se niega a arrancar si falta `JWT_SECRET` o `MONGODB_URI`, o si en producción falta `CORS_ORIGINS`.

## Comandos

```bash
npm run dev          # frontend en desarrollo
npm run build        # genera la versión de producción en dist/
npm run preview      # previsualiza la compilación
npm run lint         # analiza el código con ESLint (frontend, servidor y función)
npm run server       # arranca la API como servicio
npm run server:dev   # API con recarga automática
npm run server:test  # pruebas de la API
```

## API

Todas las respuestas son JSON. Los errores siguen siempre el formato `{ "error": { "code", "message", "details?" } }`.

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `POST /api/auth/register` | Público | Crea la cuenta (`name`, `email`, `password`) e inicia sesión. |
| `POST /api/auth/login` | Público | Inicia sesión (`email`, `password`). |
| `POST /api/auth/logout` | Público | Cierra la sesión: borra la cookie e invalida los tokens emitidos. |
| `GET /api/auth/me` | Privado | Devuelve el usuario actual. |
| `GET /api/favorites` | Privado | Lista los favoritos del usuario. |
| `PUT /api/favorites/:productId` | Privado | Añade un favorito. |
| `DELETE /api/favorites/:productId` | Privado | Quita un favorito. |
| `POST /api/favorites/merge` | Privado | Incorpora los favoritos guardados como anónimo (`ids`). |
| `GET /api/cart` | Privado | Devuelve el carrito. |
| `PUT /api/cart/:productId` | Privado | Fija la cantidad (`quantity`; 0 elimina la línea; máximo el stock). |
| `DELETE /api/cart/:productId` | Privado | Elimina una línea. |
| `DELETE /api/cart` | Privado | Vacía el carrito. |
| `POST /api/cart/merge` | Privado | Incorpora el carrito anónimo (`items`) conservando la mayor cantidad de cada pala y respetando el stock. Es idempotente: repetirlo no duplica nada. |
| `GET /api/health` | Público | Estado real del servicio: hace un `ping` a MongoDB y responde 503 si no contesta. |

## Autenticación y seguridad

- **Contraseñas:** se cifran con bcrypt (12 rondas); solo se guarda el hash, que nunca se devuelve. Mínimo 8 caracteres y máximo 72 **bytes** (bcrypt solo usa los primeros 72 bytes; las letras con tilde y los símbolos ocupan más de uno).
- **Sesión:** JWT con caducidad (7 días) guardado en una cookie `httpOnly`, `Secure` en producción y `SameSite=Lax`. El código del navegador nunca ve el token. Una segunda cookie sin datos (`pm_auth=1`) solo indica al frontend que puede haber sesión para evitar consultas innecesarias.
- **Cierre de sesión real:** además de borrar la cookie, se incrementa una versión de sesión en el usuario, de modo que un token copiado antes del cierre deja de ser válido.
- **Concurrencia:** las escrituras del carrito y de los favoritos son operaciones atómicas de MongoDB sobre una línea concreta, no «leer, modificar y guardar entero»: varias pestañas, dispositivos o instancias serverless no se pisan entre sí. La fusión del carrito anónimo es idempotente.
- **Validación:** todas las entradas se validan con Zod; el email se normaliza y se rechazan operadores de MongoDB (`$ne`, etc.) como forma de inyección.
- **Separación de usuarios:** todas las operaciones privadas se aplican siempre sobre el usuario de la sesión; el servidor ignora cualquier identificador de usuario enviado en la petición.
- **Cabeceras y orígenes:** Helmet, CORS limitado a `CORS_ORIGINS` con credenciales y comprobación del origen en las peticiones que modifican datos (defensa frente a CSRF).
- **Límites:** máximo de intentos de registro e inicio de sesión por IP (compartido entre ambos) y límite general de la API.
- **Errores:** formato único; los fallos internos y de base de datos no revelan trazas, cadenas de conexión ni detalles.
- **Mismo mensaje para email desconocido y contraseña incorrecta**, con un tiempo de respuesta equivalente.

## Persistencia y `localStorage`

- **Con sesión:** favoritos y carrito se guardan en MongoDB, asociados al usuario. En el navegador no se guarda ninguna contraseña, token ni dato de usuario.
- **Sin sesión:** favoritos y carrito se guardan en `localStorage` (claves `palamarket:favorites` y `palamarket:cart`) para que la tienda funcione sin cuenta. Al iniciar sesión se añaden a la cuenta (conservando la mayor cantidad de cada pala) y se borran del dispositivo; la fusión es idempotente, así que repetirla tras un fallo de red no duplica nada. Al cerrar sesión se limpia el estado privado de la pantalla sin borrar los datos del servidor.
- **Preferencias:** el tema (`palamarket:theme`) se guarda siempre en `localStorage`.
- Al cargar los datos locales se validan: se descartan modelos que ya no existen y cantidades superiores al stock. Si el navegador bloquea el almacenamiento, la aplicación sigue funcionando sin persistencia.
- Los cambios del usuario con sesión se muestran al instante y se envían al servidor en orden; si el servidor los rechaza o no responde, se restaura el último estado confirmado y se avisa.

## Compra y contacto simulados

El proceso de compra no procesa pagos ni transmite datos de pago. El formulario de contacto valida la información en el navegador, muestra una confirmación y descarta el contenido: no se envía a ningún sitio.

## Pruebas

```bash
npm run server:test
```

Las 61 pruebas de la API usan una base de datos MongoDB en memoria y cubren: registro correcto, duplicado y datos inválidos; login correcto e incorrecto; inyección de operadores; cierre de sesión e invalidación del token; tokens caducados, manipulados o sin firma; favoritos y carrito (stock, cantidades, fusión); separación de datos entre usuarios; persistencia entre sesiones; CORS, comprobación de origen, cabeceras de seguridad, límite de intentos y formato de errores; configuración de producción y base de datos no disponible.

Además hay un grupo de pruebas **de producción** (cookies `Secure`, CORS limitado al dominio real, defensa CSRF, HSTS y Helmet, límite de intentos detrás de un proxy que no se puede saltar añadiendo IPs falsas, y ausencia de contraseñas, hashes, tokens y variables privadas en cualquier respuesta) y otro **serverless**: varias instancias independientes que solo comparten la base de datos, para comprobar que las sesiones no dependen de la memoria y que el cierre de sesión invalida el token en todas ellas. También hay pruebas de concurrencia del carrito (peticiones simultáneas desde varias pestañas), de idempotencia de la fusión, del límite de 72 bytes de bcrypt y de la función de Vercel cuando falta configuración (responde 503 en JSON, sin nombres ni valores de variables).

## Despliegue

1. **Base de datos:** crea un clúster en [MongoDB Atlas](https://www.mongodb.com/atlas), un usuario de base de datos con contraseña propia y permite el acceso de red desde Vercel. Copia la cadena de conexión.
2. **Vercel:** importa el repositorio. `vercel.json` ya define la compilación de Vite, la función `api/index.js` (con `includeFiles` para empaquetar explícitamente el binario nativo de `bcrypt` para Linux) y las reescrituras (`/api/*` a la función y el resto a `index.html`). Vercel instala las dependencias del servidor porque `server/` es un workspace de npm, y usa Node `22.x` según `engines`.
3. **Variables de entorno** en el proyecto de Vercel, marcadas para *Production* y también para *Preview* si quieres probar la rama antes de fusionarla: `MONGODB_URI`, `JWT_SECRET` (valor aleatorio nuevo, distinto al de desarrollo) y `CORS_ORIGINS=https://palamarket.vercel.app`. `NODE_ENV=production` lo establece Vercel. En una vista previa la web y la API comparten dominio, así que no hace falta añadir su URL a `CORS_ORIGINS`.
4. Despliega y comprueba `/api/health` (debe responder `{"status":"ok","database":"up"}`). Prueba después registro, inicio de sesión, favoritos, carrito y cierre de sesión.

Notas: el límite de peticiones se mantiene en memoria de cada instancia de la función, de modo que no es global; para un límite estricto habría que usar un almacén compartido (por ejemplo, Redis). El registro responde 409 si el email ya existe, lo que permite saber si una cuenta existe; es una decisión asumida en este proyecto (el login, en cambio, no lo revela). La rama de trabajo no debe fusionarse en `main` hasta haber probado la API desplegada en una vista previa.

## Decisiones técnicas

- **JavaScript vanilla en el frontend:** mantiene el alcance académico y hace visibles el enrutado, el estado y la renderización sin abstracciones de framework.
- **Hash router:** rutas propias sin depender de configuración de servidor.
- **Estado observable centralizado:** `appState.js` coordina carrito, favoritos, sesión y tema, y sincroniza con la API con actualización inmediata y reversión si falla.
- **Cliente HTTP único:** `services/api.js` concentra las peticiones, los tiempos de espera y el formato de errores.
- **Cookie `httpOnly` y mismo dominio:** evita guardar el token en el navegador y elimina la necesidad de abrir CORS.
- **Backend reutilizado y reescrito:** se conserva la pila de `ProyectoPalas`, pero se reescriben el modelo de usuario, la sesión, los middlewares y los controladores por seguridad y compatibilidad.
- **Fotografías de producto:** cada modelo enlaza su fotografía real (`image`) y la página de procedencia (`imageSource`) en `src/data/products.js`; no se emparejan fotos con modelos distintos.
- **Diseño accesible:** landmarks semánticos, etiquetas visibles, navegación por teclado, foco perceptible, botones con nombre accesible y respeto por `prefers-reduced-motion`.

## Mejoras futuras

- Catálogo en la base de datos en lugar de en el código.
- Comparador de dos o tres palas y historial de productos vistos.
- Pedidos reales y pasarela de pago.
- Verificación de email y restablecimiento de contraseña.
- Límite de peticiones con almacén compartido.
- Pruebas end-to-end integradas en CI.

## Autor

Erik Portillo Modrego

## Fuentes de imágenes

Las fotografías se utilizan **exclusivamente con finalidad académica y no comercial**, para mostrar modelos reales en esta demostración sin ventas. No se reivindica licencia comercial alguna sobre ellas: pertenecen a sus respectivos titulares. La procedencia exacta de cada imagen está en el campo `imageSource` de cada producto en `src/data/products.js`. Las fuentes son:

- [Babolat](https://www.babolat.com/us/padel/racquets.html): los 13 modelos Babolat.
- [NOX](https://www.noxsport.com/): AT10 Genius 18K Alum (2025 y 2026) y AT10 Genius 12K.
- [StarVie](https://starvie.com/): Metheora+.
- [Adidas](https://www.adidas.es/pala-de-padel-metalbone-2026/KL2612.html): Metalbone 2026.
- Distribuidores: [Padel Market](https://padelmarket.com/) (Head y Bullpadel Hack 03), [Paleteros.es](https://paleteros.es/) (Head Extreme Motion), [MegaPadelStore](https://www.megapadel.store/) y [Sur Sports](https://sursports.cl/) (NOX ML10), [Padelvice](https://www.padelvice.com/) (StarVie Triton Pro) y [Padel Island](https://www.padel-island.com/) (StarVie Astrum Eris).
