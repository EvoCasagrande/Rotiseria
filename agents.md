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