export const TOKEN_KEY = 'rotiseria.jwt'

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const

export const ORDER_STATUS_LABELS = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En preparacion',
  READY: 'Listo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
} as const

export const formatPrice = (value: string | number) =>
  Number(value).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  })
