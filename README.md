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
ADMIN_PASSWORD="..."
```

En produccion, `JWT_SECRET` debe ser un valor largo y aleatorio de al menos 32 caracteres.

## Comandos

```bash
npm install
npx prisma generate
npm run dev
npm run seed
```

Crear o actualizar el admin inicial:

```bash
npm run seed
```

El seed tambien carga un menu demo. Por defecto no elimina datos existentes.

Para limpiar pedidos, productos y categorias antes de cargar el menu demo, ejecutar explicitamente:

```powershell
$env:ALLOW_DESTRUCTIVE_SEED="true"; npm run seed
```

Este modo elimina items de pedidos, pedidos, productos y categorias. No elimina `AdminUser`.

Para crear el admin con otra contrasena cuando todavia no existe:

```powershell
$env:ADMIN_PASSWORD="una-contrasena-segura"; npm run seed
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

## Checklist MVP

- Ejecutar migraciones con `npm run db:deploy`.
- Ejecutar seed con contrasena segura para el admin inicial.
- Cambiar la contrasena por defecto `Admin123` antes de publicar.
- Usar `JWT_SECRET` fuerte en produccion.
- Verificar el flujo completo: crear productos, crear pedido publico, verlo en admin y cambiar estados.
