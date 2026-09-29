# Proyecto Rotisería

## Contexto general

Este repositorio corresponde a un proyecto MVP para una rotisería pequeña que está próxima a inaugurarse.

La idea principal es desarrollar una aplicación web sencilla que permita organizar los pedidos del negocio.

El sistema tendrá dos partes principales:

1. Una interfaz pública para clientes.
2. Un panel interno para la administración de la rotisería.

El proyecto se encuentra en una etapa MUY inicial de desarrollo.

No asumir que las funcionalidades, modelos, endpoints o pantallas descriptas en este documento ya están implementadas.

Antes de realizar cualquier cambio, revisar siempre el estado real del repositorio.

---

## Objetivo del MVP

El flujo principal que se busca implementar es:

Cliente consulta el menú  
→ selecciona productos  
→ realiza un pedido  
→ la rotisería recibe el pedido  
→ cambia su estado durante la preparación  
→ el pedido queda registrado en el historial.

El objetivo actual es construir este circuito de la forma más simple posible.

No se busca todavía desarrollar un sistema completo de gestión gastronómica.

---

## Stack previsto

### Backend

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Supabase como proveedor de PostgreSQL
- Zod para validación

### Frontend

El frontend todavía puede no estar definido o implementado.

Antes de utilizar o recomendar un framework, revisar qué existe actualmente en el repositorio.

No asumir tecnologías que todavía no hayan sido incorporadas.

---

## Estado actual

El desarrollo recién comienza.

Actualmente puede existir solamente una parte mínima de la estructura del backend.

La gestión de categorías es una de las primeras funcionalidades que se están desarrollando.

Por este motivo:

- no asumir que existe autenticación;
- no asumir que existe frontend;
- no asumir que existe gestión de pedidos;
- no asumir que todos los modelos mencionados aquí existen en Prisma;
- no crear infraestructura innecesaria de forma anticipada;
- no hacer refactors grandes sin necesidad.

Priorizar siempre cambios pequeños y progresivos.

---

# Funcionalidades previstas

## Cliente

El cliente debería poder:

- consultar el menú;
- ver productos agrupados por categorías;
- agregar productos a un carrito;
- modificar cantidades;
- realizar un pedido;
- ingresar nombre y teléfono;
- indicar retiro o envío;
- ingresar dirección cuando corresponda;
- agregar observaciones;
- ver una confirmación del pedido.

No se requiere inicialmente que el cliente tenga una cuenta.

---

## Administración

El personal de la rotisería debería poder:

- iniciar sesión;
- consultar pedidos;
- ver el detalle de cada pedido;
- cambiar el estado de un pedido;
- consultar pedidos anteriores;
- administrar productos;
- administrar categorías.

---

# Entidades principales previstas

Estas entidades representan el diseño esperado del dominio, pero deben compararse siempre con el schema real de Prisma antes de modificar código.

## Category

Representa una categoría del menú.

Ejemplos:

- Pizzas
- Empanadas
- Milanesas
- Bebidas
- Postres

Campos conceptuales:

- id
- name
- active
- createdAt
- updatedAt

Relación:

Una categoría puede tener muchos productos.

Es preferible poder desactivar categorías en lugar de eliminarlas físicamente.

---

## Product

Representa un producto ofrecido por la rotisería.

Campos conceptuales:

- id
- name
- description
- price
- imageUrl
- active
- categoryId
- createdAt
- updatedAt

Relación:

Cada producto pertenece a una categoría.

Los productos deberían poder desactivarse sin ser eliminados.

---

## Order

Representa un pedido realizado por un cliente.

Campos conceptuales:

- id
- customerName
- phone
- orderType
- address
- notes
- status
- total
- createdAt
- updatedAt

Un pedido tiene uno o más items.

---

## OrderItem

Representa cada producto incluido en un pedido.

Campos conceptuales:

- id
- orderId
- productId
- quantity
- unitPrice
- subtotal

Es importante conservar el precio del producto al momento del pedido.

Si el precio del producto cambia posteriormente, los pedidos históricos no deben cambiar.

El backend debe calcular y validar los precios.

No confiar en precios o totales enviados por el frontend.

---

# Estados previstos de los pedidos

Inicialmente:

- PENDING
- CONFIRMED
- PREPARING
- READY
- COMPLETED
- CANCELLED

Flujo habitual:

PENDING  
→ CONFIRMED  
→ PREPARING  
→ READY  
→ COMPLETED

CANCELLED representa un pedido cancelado.

No implementar lógica compleja de estados salvo que sea necesaria.

---

# API prevista

Usar `/api` como prefijo general.

Estos endpoints representan el objetivo del MVP y no implican que ya existan.

## Auth

POST /api/auth/login

GET /api/auth/me

---

## Categories

GET /api/categories

GET /api/categories/:id

POST /api/categories

PATCH /api/categories/:id

DELETE /api/categories/:id

Filtros previstos para el listado:

- search
- active

Ejemplo:

GET /api/categories?search=pizza&active=true

---

## Products

GET /api/products

GET /api/products/:id

POST /api/products

PATCH /api/products/:id

DELETE /api/products/:id

Filtros previstos:

- search
- categoryId
- active

---

## Orders

POST /api/orders

GET /api/orders

GET /api/orders/:id

PATCH /api/orders/:id/status

Filtros previstos:

- status
- fecha
- rango de fechas
- búsqueda

No crear inicialmente un endpoint separado de historial.

El historial puede resolverse filtrando `/api/orders`.

---

# Pantallas previstas

## Cliente

### Menú

Mostrar categorías y productos disponibles.

### Carrito

Permitir:

- agregar productos;
- modificar cantidades;
- eliminar productos;
- visualizar subtotal y total.

### Finalizar pedido

Solicitar:

- nombre;
- teléfono;
- tipo de pedido;
- dirección cuando corresponda;
- observaciones.

### Confirmación

Mostrar que el pedido fue recibido y un resumen del mismo.

---

## Administración

### Login

Acceso del personal.

### Pedidos

Debe mostrar principalmente los pedidos activos y sus estados.

### Detalle del pedido

Debe mostrar:

- cliente;
- teléfono;
- productos;
- cantidades;
- precio;
- total;
- observaciones;
- estado.

Debe permitir actualizar el estado.

### Productos

Permitir:

- listar;
- buscar;
- crear;
- editar;
- activar o desactivar.

### Categorías

Permitir:

- listar;
- buscar;
- crear;
- editar;
- activar o desactivar.

### Historial

Consultar pedidos anteriores mediante filtros.

---

# Prioridad de desarrollo

La prioridad general prevista es:

1. Categories
2. Products
3. Orders
4. Authentication
5. Panel de administración
6. Interfaz pública del cliente

Esto puede ajustarse según el estado real del repositorio.

La prioridad principal es llegar cuanto antes a un flujo funcional completo.

---

# Fuera del alcance actual

No implementar todavía salvo pedido explícito:

- gestión avanzada de stock;
- proveedores;
- compras;
- facturación;
- contabilidad;
- caja o POS;
- estadísticas avanzadas;
- promociones complejas;
- programa de fidelización;
- cuentas para clientes;
- múltiples sucursales;
- delivery con geolocalización;
- seguimiento GPS;
- integraciones con WhatsApp;
- integraciones con Mercado Pago;
- notificaciones push;
- arquitectura de microservicios;
- infraestructura innecesariamente compleja.

---

# Reglas para trabajar en este repositorio

## Antes de modificar código

Siempre:

1. Revisar los archivos existentes.
2. Revisar `package.json`.
3. Revisar el schema de Prisma.
4. Revisar las rutas existentes.
5. Revisar controllers, services y schemas existentes.
6. Entender los patrones ya utilizados.

No asumir estructura de archivos ni arquitectura.

---

## Al escribir código

Priorizar:

- TypeScript estricto;
- código simple;
- nombres claros;
- funciones pequeñas;
- separación razonable entre rutas, controllers, services y validaciones;
- validación de entrada con Zod;
- Prisma para acceso a datos;
- respuestas HTTP consistentes;
- manejo explícito de errores.

Evitar sobreingeniería.

No agregar abstracciones si todavía existe un único caso de uso que las necesite.

---

## Prisma

Antes de modificar el schema:

- revisar las relaciones existentes;
- revisar migraciones;
- evitar cambios destructivos innecesarios;
- no ejecutar migraciones destructivas automáticamente;
- explicar cualquier cambio importante de base de datos.

Nunca asumir que una propiedad existe en Prisma solamente porque aparece mencionada en este documento.

El schema real es la fuente de verdad.

---

## Cambios grandes

Antes de realizar cambios importantes de arquitectura:

- explicar brevemente qué se quiere cambiar;
- justificar por qué;
- preferir una solución simple;
- evitar modificar partes no relacionadas con la tarea.

---

# Criterio general

Este es un MVP para un negocio pequeño.

Las decisiones técnicas deben favorecer:

- simplicidad;
- mantenibilidad;
- rapidez de desarrollo;
- facilidad de uso;
- bajo costo;
- posibilidad de ampliar el sistema más adelante.

No diseñar el sistema como si fuera una plataforma de gran escala.

Primero debe funcionar correctamente el circuito básico de pedidos.
---

# Estado real actualizado para Codex

Esta seccion documenta el estado real del repo al 2026-09-29 para que otra sesion pueda continuar sin depender del historial de chat.

## Backend implementado

Stack real:

- Node.js + TypeScript + Express.
- Prisma 7 con cliente generado en `generated/prisma`.
- PostgreSQL/Supabase via `@prisma/adapter-pg`.
- Zod para validacion.
- JWT + bcryptjs para autenticacion admin.

Modulos actuales:

- `src/modules/categories`
- `src/modules/products`
- `src/modules/orders`
- `src/modules/auth`

Middlewares:

- `src/middlewares/validate.ts`: valida schemas Zod y guarda datos parseados en `res.locals.validated`.
- `src/middlewares/errorHandler.ts`: handler centralizado para `AppError`, errores conocidos de Prisma y JSON invalido.
- `src/middlewares/requireAuth.ts`: valida `Authorization: Bearer TOKEN`, busca admin activo y guarda un admin seguro en `res.locals.admin`.

Auth:

- `POST /api/auth/login` es publico.
- `GET /api/auth/me` esta protegido con `requireAuth` y devuelve `res.locals.admin`.
- El token se firma con `JWT_SECRET`.
- El login nunca debe devolver `passwordHash`.

Rutas publicas:

- `GET /api/health`
- `GET /api/categories`
- `GET /api/categories/:id`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders`
- `POST /api/auth/login`

Rutas protegidas:

- `GET /api/auth/me`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`
- `POST /api/products`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`

Orders:

- `OrderItem.unitPrice` conserva el precio historico del producto.
- El backend calcula `Order.total`; no confiar en totales/precios enviados por frontend.
- `POST /api/orders` recibe items con `productId` y `quantity`.
- `PATCH /api/orders/:id/status` solo cambia estado.
- Estado final real actual: `COMPLETED` en Prisma/schema y Zod.

Seed:

- Existe `prisma/seed.ts`.
- Crea/upsertea admin inicial:
  - email: `admin@rotiseria.com`
  - password dev: `Admin123`
- Comando: `npx tsx prisma/seed.ts`.

Tests/build:

- `vitest` esta instalado.
- Existe `tests/AppError.test.ts`.
- `npm run test:run` puede requerir ejecucion fuera del sandbox porque Vitest crea workers.
- `npm run build` genera Prisma client y compila backend.
- `dist` esta ignorado en `.gitignore`.

## Frontend implementado

Existe frontend en `client/`.

Stack real:

- Vite + React + TypeScript.
- Sin router ni librerias extra todavia.
- `client/vite.config.ts` proxya `/api` a `http://localhost:3000`.

Pantalla actual:

- `client/src/App.tsx` tiene login admin.
- Login pega a `POST /api/auth/login`.
- Guarda JWT en `localStorage` con clave `rotiseria.jwt`.
- Al cargar, intenta restaurar sesion con `GET /api/auth/me`.
- Muestra admin logueado, permite validar sesion y cerrar sesion.

Comandos frontend:

- `cd client`
- `npm run dev -- --host 127.0.0.1`
- `npm run build`

Servidores usados durante desarrollo:

- Backend: `http://localhost:3000`
- Frontend: `http://127.0.0.1:5173`

## Siguiente objetivo frontend

Agregar vista de pedidos al panel admin:

- Tras login, listar `GET /api/orders` usando `Authorization: Bearer TOKEN`.
- Mostrar cliente, telefono, tipo, estado, total, fecha e items.
- Permitir cambiar estado con `PATCH /api/orders/:id/status`.
- Mantenerlo simple, en `client/src/App.tsx` por ahora; no agregar router hasta que haya mas pantallas.

## Actualizacion frontend 2026-09-29

Vista de pedidos agregada en `client/src/App.tsx`:

- Tras login o restauracion de sesion, carga `GET /api/orders` con `Authorization: Bearer TOKEN`.
- Muestra pedidos con cliente, telefono, tipo, estado, total, fecha, direccion/notas e items.
- Cada item muestra cantidad, nombre de producto y `unitPrice` historico.
- Permite cambiar estado con `PATCH /api/orders/:id/status`.
- Estados usados por frontend: `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`.
- La UI sigue sin router; todo esta en `App.tsx` y estilos en `App.css`.
- `client npm run build` pasa correctamente.

## Actualizacion frontend layout 2026-09-29

El panel admin fue refactorizado:

- Antes de login se mantiene la pantalla partida con imagen + formulario.
- Despues de login se usa layout full width con topbar fija, marca, navegacion y usuario.
- Navegacion interna actual: `Pedidos`, `Categorias`, `Productos`.
- `Pedidos` sigue siendo funcional: lista pedidos, refresca, valida sesion y cambia estado.
- `Categorias` y `Productos` existen como placeholders visibles para el siguiente desarrollo.
- No se agrego router todavia; el estado `activeSection` en `client/src/App.tsx` controla la seccion activa.
- El build del frontend sigue pasando con `client npm run build`.

## Actualizacion frontend categorias 2026-09-29

La seccion `Categorias` del panel admin ya esta implementada en `client/src/App.tsx`:

- Carga categorias con `GET /api/categories` al entrar a la pestaña.
- Muestra nombre, cantidad de productos (`_count.products`), estado activa/inactiva y acciones.
- Permite crear categoria con `POST /api/categories` usando JWT.
- Permite editar nombre con `PATCH /api/categories/:id` usando JWT.
- Permite desactivar con `DELETE /api/categories/:id` usando JWT.
- Tras crear/editar/desactivar se refresca la lista.
- `client npm run build` pasa correctamente.

## Actualizacion frontend productos 2026-09-29

La seccion `Productos` del panel admin ya esta implementada en `client/src/App.tsx`:

- Carga productos con `GET /api/products` al entrar a la pestaña.
- Carga categorias con `GET /api/categories` para el selector de categoria.
- Muestra producto, descripcion, categoria, precio, estado y acciones.
- Permite crear producto con `POST /api/products` usando JWT.
- Permite editar nombre, descripcion, precio y categoria con `PATCH /api/products/:id` usando JWT.
- Permite desactivar con `DELETE /api/products/:id` usando JWT.
- Tras crear/editar/desactivar se refresca la lista.
- El precio se envia como number; el input del frontend mantiene string y se convierte con `Number` al enviar.
- `client npm run build` pasa correctamente.

## Punto de continuacion recomendado 2026-09-29

El panel admin minimo esta completo:

- Login admin.
- Restauracion de sesion con JWT.
- Pedidos: listar, refrescar, cambiar estado.
- Categorias: listar, crear, editar, desactivar.
- Productos: listar, crear, editar, desactivar.

Siguiente objetivo recomendado: interfaz publica del cliente.

Objetivo MVP del frontend publico:

1. Ruta publica `/` para clientes, sin login.
2. Ruta admin `/admin` para el panel interno.
3. Cargar categorias/productos activos desde API publica.
4. Mostrar menu agrupado por categorias.
5. Carrito simple en estado local.
6. Permitir modificar cantidades y eliminar items.
7. Checkout con nombre, telefono, tipo de pedido, direccion si es envio y notas.
8. Crear pedido con `POST /api/orders`.
9. Mostrar confirmacion del pedido creado.
10. Verificar que el pedido aparezca en el panel admin.

Decision tecnica pendiente:

- Conviene agregar `react-router-dom` para separar `/` y `/admin`.
- Alternativa simple: manejar `window.location.pathname` manualmente, pero no escala tan bien.
- Recomendacion actual: instalar `react-router-dom` y separar componentes principales:
  - `PublicMenuPage`
  - `AdminPage`
  - `LoginPage` si se decide extraerlo

Notas para otra sesion Codex:

- Antes de tocar frontend, leer `client/src/App.tsx` y `client/src/App.css` completos.
- El frontend todavia esta todo en `App.tsx`; evitar refactors grandes salvo que sean necesarios para separar publico/admin.
- Si se agrega `react-router-dom`, hacerlo de forma incremental.
- Mantener ASCII en textos nuevos para evitar problemas de encoding.
- Verificar siempre con `cd client && npm run build`.
- Si Vitest o Vite fallan con `spawn EPERM`, repetir fuera del sandbox con aprobacion.
