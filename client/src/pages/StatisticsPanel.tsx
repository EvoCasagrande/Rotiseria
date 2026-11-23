import { useEffect, useMemo, useState } from 'react'
import { apiPath, readError } from '../api'
import { calculateStatistics } from '../statistics'
import type { StatisticsPeriod } from '../statistics'
import type { Order } from '../types'
import { formatPrice } from '../utils'

export function StatisticsPanel({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [period, setPeriod] = useState<StatisticsPeriod>('30')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(apiPath('/api/orders'), { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
        if (!response.ok) throw new Error(await readError(response))
        const data = (await response.json()) as { orders: Order[] }
        setOrders(data.orders)
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No se pudieron cargar las estadisticas')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [token, revision])
  const stats = useMemo(() => calculateStatistics(orders, period), [orders, period])
  return <div className="dashboard statistics">
    <header className="dashboard-header"><div><h1>Estadisticas</h1><p>Una mirada a la actividad de la rotiseria.</p></div><button className="secondary compact" disabled={loading} onClick={() => setRevision((value) => value + 1)} type="button">Actualizar</button></header>
    <div className="stats-toolbar"><label htmlFor="stats-period">Periodo</label><select id="stats-period" value={period} onChange={(event) => setPeriod(event.target.value as StatisticsPeriod)}><option value="7">Ultimos 7 dias</option><option value="30">Ultimos 30 dias</option><option value="all">Todo el historial</option></select><span>Fechas segun la zona horaria de este dispositivo.</span></div>
    {error ? <p className="form-message" role="alert">{error}</p> : loading ? <p className="empty-state">Cargando estadisticas...</p> : <>
      <p className="stats-note">Los importes corresponden a pedidos completados segun su fecha de creacion. No representan cobros verificados.</p>
      <div className="stats-metrics">
        <div><span>Importe completado</span><strong>{formatPrice(stats.total)}</strong><small>{stats.completed} pedidos completados</small></div>
        <div><span>Pedidos recibidos</span><strong>{stats.count}</strong><small>Todos los estados</small></div>
        <div><span>Promedio por pedido</span><strong>{formatPrice(stats.average)}</strong><small>Pedidos completados</small></div>
        <div><span>Cancelados</span><strong>{stats.cancelled}</strong><small>{stats.active} pendientes o en curso</small></div>
      </div>
      {stats.count === 0 ? <p className="empty-state">No hay pedidos en este periodo. Proba otro rango de fechas.</p> : <div className="stats-columns">
        <section className="stats-section"><h2>Productos mas pedidos</h2><p>Unidades en pedidos completados.</p>{stats.products.length ? <table><thead><tr><th scope="col">Producto</th><th scope="col">Unidades</th><th scope="col">Importe</th></tr></thead><tbody>{stats.products.map((product) => <tr key={product.id}><th scope="row">{product.name}</th><td>{product.quantity}</td><td>{formatPrice(product.total)}</td></tr>)}</tbody></table> : <p>No hay pedidos completados en este periodo.</p>}</section>
        <section className="stats-section"><h2>Actividad</h2><p>Pedidos por modalidad, incluidos todos los estados.</p><dl><div><dt>Retiro</dt><dd>{stats.pickup}</dd></div><div><dt>Envio</dt><dd>{stats.delivery}</dd></div><div><dt>En curso</dt><dd>{stats.active}</dd></div><div><dt>Completados</dt><dd>{stats.completed}</dd></div><div><dt>Cancelados</dt><dd>{stats.cancelled}</dd></div></dl></section>
        <section className="stats-section stats-daily"><h2>Importes por dia</h2><p>Pedidos completados agrupados por fecha de creacion.</p>{stats.days.length ? <table><thead><tr><th scope="col">Fecha</th><th scope="col">Pedidos</th><th scope="col">Importe</th></tr></thead><tbody>{stats.days.map((day) => <tr key={day.date}><th scope="row">{day.date.split('-').reverse().join('/')}</th><td>{day.count}</td><td>{formatPrice(day.total)}</td></tr>)}</tbody></table> : <p>No hay pedidos completados en este periodo.</p>}</section>
      </div>}
    </>}
  </div>
}

