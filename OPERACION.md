# Operacion de la rotiseria

## Datos pendientes antes de abrir

Definir nombre comercial, direccion y horarios de retiro, telefono, medios de pago, zonas y costo de envio. No publicar importes u horarios estimados hasta que esten confirmados. La tienda actualmente informa que el costo de envio debe consultarse.

## Seguridad

La contraseña de desarrollo `Admin123` permanece por decision del usuario y debe cambiarse antes de abrir al publico. En el panel, la seccion Seguridad permite cambiarla con la contraseña actual y cierra todas las sesiones. El seed solo crea el usuario si no existe; cambiar `ADMIN_PASSWORD` y ejecutar el seed no cambia una contraseña ya existente. Si se pierde la contraseña actual, se necesitara un procedimiento de recuperacion administrativa seguro. En produccion, configurar `NODE_ENV=production`, `JWT_SECRET` fuerte y `CORS_ORIGIN` con los origenes concretos del frontend.

Los limites de solicitudes funcionan por proceso. Si se usa mas de una instancia o un proxy inverso, configurar una solucion compartida y verificar la identificacion de IP antes del despliegue. No asumir que el limite actual garantiza proteccion distribuida.

## Base de datos y recuperacion

Las migraciones `20261123160000_add_order_idempotency`, `20261123163000_add_product_image_url` y `20261123170000_add_admin_token_version` agregan campos e indice sin borrar pedidos ni cuentas. Aplicar migraciones con `npm run db:deploy` despues de verificar el destino. No ejecutar el seed de demostracion contra datos reales; puede modificar productos y categorias, y su modo destructivo elimina pedidos. El seed esta bloqueado cuando `NODE_ENV=production`.

Las imagenes de productos se indican mediante una URL HTTP o HTTPS en el panel; la aplicacion no almacena ni sube archivos de imagen. Utilizar imagenes propias alojadas en un proveedor confiable. Si falta la imagen o no carga, el producto sigue disponible.

Configurar respaldos segun el proveedor de PostgreSQL y ensayar periodicamente una restauracion en una base aislada. Registrar responsable, frecuencia, retencion y resultado de la prueba. No probar restauraciones sobre la base activa. Confirmar el alcance y disponibilidad de los respaldos con el proveedor antes de operar.

## Verificacion antes de abrir

1. Ejecutar `npm run test:run`, `npm run build` y `npm run build --prefix client`.
2. En una base de prueba aislada, crear un pedido, verificar importe y datos en admin, cambiar estados y comprobar que el carrito y la confirmacion se comportan como corresponde.
3. Probar reconexion tras un envio interrumpido y confirmar que el reintento no crea otro pedido.
4. Probar la tienda y el panel en celulares y con teclado; comprobar alertas de pedidos y restricciones del navegador para reproducir sonido.
5. Comprobar dominio, HTTPS, `VITE_API_URL`, CORS, monitoreo y notificacion ante caida; acordar un procedimiento manual si el sistema no esta disponible.

El indicador de pedidos nuevos consulta cada diez segundos mientras el panel permanece abierto. No sustituye una notificacion garantizada fuera del navegador.
