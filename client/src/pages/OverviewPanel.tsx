import { useCallback, useEffect, useRef, useState } from 'react'
import { apiPath } from '../api'
import { localDate, statisticsRange } from '../statisticsRange'
import type { AdminSection, Order, Product } from '../types'
import { formatPrice, ORDER_STATUS_LABELS } from '../utils'

type Snapshot = { count: number; completed: number; total: string }
type Resource<T> = { data: T | null; error: boolean }
const initial = <T,>(): Resource<T> => ({ data: null, error: false })

export function OverviewPanel({ token, onNavigate }: { token: string; onNavigate: (section: AdminSection) => void }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (selectedOrder && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal() }, [selectedOrder])
  const [orders, setOrders] = useState<Resource<Order[]>>(initial)
  const [products, setProducts] = useState<Resource<Product[]>>(initial)
  const [stats, setStats] = useState<Resource<Snapshot>>(initial)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true)
    const today = localDate(new Date())
    const range = statisticsRange('1', today, today)
    const params = new URLSearchParams({ from: range.from!.toISOString(), to: range.to.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' })
    const get = async <T,>(path: string, key: string): Promise<T> => {
      const response = await fetch(apiPath(path), { headers: { Authorization: `Bearer ${token}` }, signal })
      if (!response.ok) throw new Error('No disponible')
      return ((await response.json()) as Record<string, T>)[key]
    }
    const results = await Promise.allSettled([
      get<Order[]>('/api/orders', 'orders'), get<Product[]>('/api/products', 'products'), get<Snapshot>(`/api/orders/statistics?${params}`, 'statistics'),
    ])
    if (signal.aborted) return
    const unpack = <T,>(value: PromiseSettledResult<T>): Resource<T> => value.status === 'fulfilled' ? { data: value.value, error: false } : { data: null, error: true }
    setOrders(unpack(results[0])); setProducts(unpack(results[1])); setStats(unpack(results[2])); setLoading(false)
  }, [token])
  const [refresh, setRefresh] = useState(0)
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); const timer = window.setInterval(() => void load(controller.signal), 30000); return () => { controller.abort(); window.clearInterval(timer) } }, [load, refresh])
  const active = orders.data?.filter(order => !['COMPLETED', 'CANCELLED'].includes(order.status))
  const pending = active?.filter(order => order.status === 'PENDING')
  const available = products.data?.filter(product => product.active && product.category.active)
  const unavailable = products.data?.filter(product => !product.active || !product.category.active)
  const value = (resource: Resource<unknown>, content: string | number | undefined) => resource.error ? 'No disponible' : content ?? '...'
  return <div className="dashboard overview-dashboard">
    <header className="overview-heading"><div><p className="overview-date">{new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p><h1>Tu negocio, hoy</h1><p>Una mirada rapida a la operacion de la rotiseria.</p></div><button type="button" className="secondary compact" disabled={loading} onClick={() => setRefresh(value => value + 1)}>{loading ? 'Actualizando...' : 'Actualizar'}</button></header>
    <div className="overview-metrics">
      <button type="button" className="overview-metric urgent" onClick={() => onNavigate('orders')}><span>Pendientes de confirmar</span><strong>{value(orders, pending?.length)}</strong><small>Ver pedidos <span aria-hidden="true">→</span></small></button>
      <button type="button" className="overview-metric" onClick={() => onNavigate('orders')}><span>Pedidos en curso</span><strong>{value(orders, active?.length)}</strong><small>Todos los pedidos activos</small></button>
      <button type="button" className="overview-metric" onClick={() => onNavigate('statistics')}><span>Importe completado hoy</span><strong>{value(stats, stats.data ? formatPrice(stats.data.total) : undefined)}</strong><small>Segun fecha de creacion</small></button>
      <button type="button" className="overview-metric" onClick={() => onNavigate('products')}><span>Productos disponibles</span><strong>{value(products, available?.length)}</strong><small>{products.data ? `${unavailable?.length} no disponibles` : 'Revisar disponibilidad'}</small></button>
    </div>
    <div className="overview-columns">
      <section className="overview-surface"><div className="overview-section-head"><div><h2>Pedidos en curso</h2><p>Segui los pedidos que necesitan atencion.</p></div><button type="button" className="overview-text-button" onClick={() => onNavigate('orders')}>Ver pedidos <span aria-hidden="true">→</span></button></div>
        {orders.error ? <p className="overview-empty" role="alert">No se pudieron cargar los pedidos. Actualiza para reintentar.</p> : !orders.data ? <p className="overview-empty" role="status">Cargando pedidos...</p> : !active?.length ? <p className="overview-empty">No hay pedidos en curso por ahora.</p> : <div className="overview-order-list">{active.slice(0, 5).map(order => <button className="overview-order" key={order.id} type="button" onClick={() => setSelectedOrder(order)}><span className="overview-order-icon" aria-hidden="true">↗</span><span className="overview-order-name"><strong>{order.customerName}</strong><small>{order.orderType === 'DELIVERY' ? 'Envio' : 'Retiro'} · {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })}</small></span><span className={`status-badge status-${order.status.toLowerCase()}`}>{ORDER_STATUS_LABELS[order.status]}</span><strong className="overview-order-total">{formatPrice(order.total)}</strong></button>)}</div>}
      </section>
      <aside className="overview-side"><section className="overview-surface availability"><div className="overview-section-head"><div><h2>Tu menu</h2><p>Disponibilidad actual</p></div><button type="button" className="overview-text-button" onClick={() => onNavigate('products')}>Administrar <span aria-hidden="true">→</span></button></div>
        {products.error ? <p className="overview-empty" role="alert">No se pudo cargar el menu.</p> : !products.data ? <p className="overview-empty" role="status">Cargando menu...</p> : <><div className="availability-number"><strong>{available?.length}</strong><span>productos disponibles<br />para tus clientes</span></div><div className="availability-line"><span>No disponibles</span><strong>{unavailable?.length}</strong></div><p className="overview-note">Incluye productos inactivos o con categoria inactiva.</p></>}
      </section><section className="overview-action"><div><h2>Necesitas revisar algo?</h2><p>Consulta tu catalogo, pedidos y configuracion desde un solo lugar.</p></div><button type="button" onClick={() => onNavigate('orders')}>Ir a pedidos <span aria-hidden="true">→</span></button></section></aside>
    </div>
    {selectedOrder && <dialog ref={dialogRef} className="order-detail-dialog" aria-labelledby="order-detail-title" onCancel={() => setSelectedOrder(null)}>
      <div className="order-detail-heading"><div><p>Detalle del pedido</p><h2 id="order-detail-title">{selectedOrder.customerName}</h2></div><button className="secondary" type="button" onClick={() => setSelectedOrder(null)} aria-label="Cerrar detalle">X</button></div>
      <p className="order-detail-id">Pedido {selectedOrder.id}</p><span className={`status-badge status-${selectedOrder.status.toLowerCase()}`}>{ORDER_STATUS_LABELS[selectedOrder.status]}</span>
      <dl className="order-detail-info"><div><dt>Telefono</dt><dd>{selectedOrder.customerPhone}</dd></div><div><dt>Modalidad</dt><dd>{selectedOrder.orderType === 'DELIVERY' ? 'Envio' : 'Retiro'}</dd></div><div><dt>Fecha</dt><dd>{new Date(selectedOrder.createdAt).toLocaleString('es-AR')}</dd></div>{selectedOrder.address && <div><dt>Direccion</dt><dd>{selectedOrder.address}</dd></div>}{selectedOrder.notes && <div><dt>Observaciones</dt><dd>{selectedOrder.notes}</dd></div>}</dl>
      <h3>Productos</h3><ul className="order-detail-items">{selectedOrder.items.map(item => <li key={item.id}><span>{item.quantity} x {item.product.name}</span><strong>{formatPrice(Number(item.unitPrice) * item.quantity)}</strong></li>)}</ul><div className="order-detail-total"><span>Total</span><strong>{formatPrice(selectedOrder.total)}</strong></div>
      <button type="button" onClick={() => { setSelectedOrder(null); onNavigate('orders') }}>Gestionar pedidos</button>
    </dialog>}
    <p className="overview-footnote">El importe corresponde a pedidos completados creados hoy; no representa cobros verificados.</p>
  </div>
}
