# Rotiseria

Backend MVP para administrar menu, productos, pedidos y acceso interno de una rotiseria.

## Requisitos

- Node.js
- PostgreSQL
- Variables de entorno en `.env`:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
PORT=3000
```

## Comandos

```bash
npm install
npx prisma generate
npm run dev
```

Crear o actualizar el admin inicial:

```bash
npx tsx prisma/seed.ts
```

Compilar:

```bash
npm run build
```

Ejecutar build:

```bash
npm start
```

## Auth

Login:

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "admin@rotiseria.com",
  "password": "Admin123"
}
```

Usar el token en rutas protegidas:

```http
Authorization: Bearer TOKEN
```

Usuario actual:

```http
GET /api/auth/me
```

## Endpoints

Publicos:

```http
GET /api/health
GET /api/categories
GET /api/categories/:id
GET /api/products
GET /api/products/:id
POST /api/orders
POST /api/auth/login
```

Protegidos:

```http
GET /api/auth/me
POST /api/categories
PATCH /api/categories/:id
DELETE /api/categories/:id
POST /api/products
PATCH /api/products/:id
DELETE /api/products/:id
GET /api/orders
GET /api/orders/:id
PATCH /api/orders/:id/status
```

## Notas

- Los productos y categorias se desactivan con `active: false`.
- Los pedidos se cancelan cambiando `status` a `CANCELLED`.
- El total de un pedido se calcula en el backend.
- El frontend no debe enviar precios ni totales al crear pedidos.
