import { useEffect, useState, type FormEvent } from 'react'
import { apiPath, readError } from '../api'
import { localDate, percentChange, statisticsRange, type Period } from '../statisticsRange'
import { formatPrice } from '../utils'

type Statistics = { count: number; completed: number; cancelled: number; active: number; delivery: number; pickup: number; total: string; average: string; products: { id: string; name: string; quantity: number; total: string }[]; days: { date: string; count: number; total: string }[] }
type Filter = { period: Period; from: string; to: string }

function Comparison({ current, previous }: { current: number; previous?: number }) {
  return <small>{previous === undefined ? 'Sin comparación para todo el historial' : percentChange(current, previous)}</small>
}

function Distribution({ label, value, total }: { label: string; value: number; total: number }) {
  return <div className="stats-distribution-row"><div><span>{label}</span><strong>{value} <small>({total ? Math.round(value * 100 / total) : 0}%)</small></strong></div><div className="stats-track" aria-hidden="true"><i style={{ width: `${total ? value * 100 / total : 0}%` }} /></div></div>
}

export function StatisticsPanel({ token }: { token: string }) {
  const today = localDate(new Date())
  const [draft, setDraft] = useState<Filter>({ period: '30', from: today, to: today })
  const [filter, setFilter] = useState<Filter>(draft)
  const [stats, setStats] = useState<Statistics | null>(null)
  const [previous, setPrevious] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterError, setFilterError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const range = statisticsRange(filter.period, filter.from, filter.to)
        const request = async (from: Date | undefined, to: Date) => {
          const params = new URLSearchParams({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', to: to.toISOString() })
          if (from) params.set('from', from.toISOString())
          const response = await fetch(apiPath(`/api/orders/statistics?${params}`), { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
          if (!response.ok) throw new Error(await readError(response))
          return ((await response.json()) as { statistics: Statistics }).statistics
        }
        const [current, prior] = await Promise.all([request(range.from, range.to), range.previousTo ? request(range.previousFrom, range.previousTo) : Promise.resolve(null)])
        setStats(current)
        setPrevious(prior)
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No se pudieron cargar las estadísticas')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [token, revision, filter])

  const applyFilter = (event: FormEvent) => {
    event.preventDefault()
    try {
      statisticsRange(draft.period, draft.from, draft.to)
      setFilterError('')
      setFilter({ ...draft })
    } catch (err) {
      setFilterError(err instanceof Error ? err.message : 'Revisá el rango de fechas.')
    }
  }
  const days = stats ? [...stats.days].reverse() : []
  const chartDays = days.slice(-30)
  const maxDaily = Math.max(...chartDays.map((day) => Number(day.total)), 1)
  const maxProduct = Math.max(...(stats?.products ?? []).map((product) => product.quantity), 1)

  return <div className="dashboard statistics">
    <header className="dashboard-header"><div><h1>Estadísticas</h1><p>La actividad de tu rotisería, en perspectiva.</p></div><button className="secondary compact" disabled={loading} onClick={() => setRevision((value) => value + 1)} type="button">Actualizar</button></header>
    <form className="stats-toolbar" onSubmit={applyFilter}>
      <label>Período<select value={draft.period} onChange={(event) => { setDraft({ ...draft, period: event.target.value as Period }); setFilterError('') }}><option value="1">Hoy</option><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="custom">Personalizado</option><option value="all">Todo el historial</option></select></label>
      {draft.period === 'custom' && <><label>Desde<input type="date" required max={draft.to || today} value={draft.from} onChange={(event) => { setDraft({ ...draft, from: event.target.value }); setFilterError('') }} /></label><label>Hasta<input type="date" required min={draft.from} max={today} value={draft.to} onChange={(event) => { setDraft({ ...draft, to: event.target.value }); setFilterError('') }} /></label></>}
      <button className="secondary compact" type="submit">Aplicar</button>
      <span>Zona horaria de este dispositivo.</span>
    </form>
    {filterError && <p className="form-message" role="alert">{filterError}</p>}
    {error ? <p className="form-message" role="alert">{error}</p> : loading || !stats ? <p className="empty-state" role="status">Cargando estadísticas...</p> : <>
      <p className="stats-note">Importes de pedidos completados, agrupados por fecha de creación. No representan cobros verificados. La comparación usa el mismo lapso anterior{filter.period !== 'all' ? ', incluida la misma hora de corte cuando corresponde' : ''}.</p>
      <div className="stats-metrics">
        <div><span>Importe completado</span><strong>{formatPrice(stats.total)}</strong><Comparison current={Number(stats.total)} previous={previous ? Number(previous.total) : undefined} /></div>
        <div><span>Pedidos recibidos</span><strong>{stats.count}</strong><Comparison current={stats.count} previous={previous?.count} /></div>
        <div><span>Promedio por pedido</span><strong>{formatPrice(stats.average)}</strong><Comparison current={Number(stats.average)} previous={previous ? Number(previous.average) : undefined} /></div>
        <div><span>Cancelados</span><strong>{stats.cancelled}</strong><Comparison current={stats.cancelled} previous={previous?.cancelled} /></div>
      </div>
      {stats.count === 0 && <p className="empty-state">No hay pedidos en este período. Probá otro rango de fechas.</p>}
      <div className="stats-columns">
        <section className="stats-section stats-daily"><h2>Evolución de importes</h2><p>Pedidos completados por fecha de creación. {days.length > 30 ? 'El gráfico muestra los últimos 30 días con actividad; la tabla incluye todos.' : 'Se muestran los días con actividad.'}</p>
          {chartDays.length ? <><div className="stats-chart" aria-hidden="true">{chartDays.map((day) => <div className="stats-chart-column" key={day.date} title={`${day.date}: ${formatPrice(day.total)}`}><div className="stats-chart-bar" style={{ height: `${Math.max(Number(day.total) / maxDaily * 100, 1)}%` }} /><span>{day.date.slice(5).split('-').reverse().join('/')}</span></div>)}</div>
            <details className="stats-details"><summary>Ver tabla de importes diarios</summary><div className="stats-table-wrap" role="region" aria-label="Importes diarios" tabIndex={0}><table><caption>Importes diarios de pedidos completados</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Pedidos</th><th scope="col">Importe</th></tr></thead><tbody>{[...days].reverse().map((day) => <tr key={day.date}><th scope="row">{day.date.split('-').reverse().join('/')}</th><td>{day.count}</td><td>{formatPrice(day.total)}</td></tr>)}</tbody></table></div></details></> : <p>No hay pedidos completados en este período.</p>}
        </section>
        <section className="stats-section"><h2>Productos más pedidos</h2><p>Hasta 10 productos, por unidades en pedidos completados.</p>
          {stats.products.length ? <><div className="stats-product-bars" aria-hidden="true">{stats.products.map((product) => <div key={product.id}><div><span>{product.name}</span><strong>{product.quantity}</strong></div><div className="stats-track"><i style={{ width: `${product.quantity / maxProduct * 100}%` }} /></div></div>)}</div><div className="stats-table-wrap" role="region" aria-label="Productos más pedidos" tabIndex={0}><table><caption>Productos más pedidos</caption><thead><tr><th scope="col">Producto</th><th scope="col">Unidades</th><th scope="col">Importe</th></tr></thead><tbody>{stats.products.map((product) => <tr key={product.id}><th scope="row">{product.name}</th><td>{product.quantity}</td><td>{formatPrice(product.total)}</td></tr>)}</tbody></table></div></> : <p>No hay productos en pedidos completados.</p>}
        </section>
        <section className="stats-section"><h2>Actividad de pedidos</h2><p>Incluye todos los estados del período.</p><h3>Modalidad</h3><Distribution label="Retiro" value={stats.pickup} total={stats.count} /><Distribution label="Envío" value={stats.delivery} total={stats.count} /><h3>Estado</h3><Distribution label="En curso" value={stats.active} total={stats.count} /><Distribution label="Completados" value={stats.completed} total={stats.count} /><Distribution label="Cancelados" value={stats.cancelled} total={stats.count} /></section>
      </div>
    </>}
  </div>
}
