import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { apiPath, readError } from '../api'
import { emptyBusinessSettings, infoPages } from '../business'
import type { BusinessSettings } from '../business'

const groups = [
  { title: 'Identidad y ubicacion', fields: [['businessName','Nombre comercial'],['legalName','Razon social o titular'],['taxId','CUIT'],['address','Direccion del local'],['mapsUrl','Enlace a la ubicacion']] },
  { title: 'Contacto y redes', fields: [['phone','Telefono'],['email','Email'],['whatsapp','WhatsApp (codigo de pais y numero, solo digitos)'],['instagram','URL de Instagram'],['facebook','URL de Facebook']] },
  { title: 'Atencion y pagos', fields: [['hours','Horarios de atencion'],['paymentMethods','Medios de pago aceptados']] },
] as const
export function BusinessSettingsPanel({ token }: { token: string }) {
  const [data, setData] = useState<BusinessSettings>(emptyBusinessSettings)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  useEffect(() => { const controller = new AbortController();
    fetch(apiPath('/api/settings/admin'), { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(await readError(response)); return response.json() as Promise<{ settings: BusinessSettings }> })
      .then(result => setData({ ...emptyBusinessSettings, ...result.settings }))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === 'AbortError')) { setMessage('No se pudo cargar la configuracion. Recarga la pagina para intentar nuevamente.'); setLoadFailed(true) } })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [token])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(''); setSaving(true)
    try {
      const response = await fetch(apiPath('/api/settings'), { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!response.ok) throw new Error(await readError(response))
      const result = await response.json() as { settings: BusinessSettings }; setData(result.settings)
      setMessage('Configuracion guardada. Los textos modificados requieren una nueva revision antes de publicarse.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar') } finally { setSaving(false) }
  }
  if (loading) return <p>Cargando configuracion...</p>
  if (loadFailed) return <p className="form-message" role="alert">{message}</p>
  const pending = [
    ...(!data.businessName ? ['Nombre comercial'] : []), ...(!data.legalName ? ['Titular o razon social'] : []),
    ...(!data.taxId ? ['CUIT'] : []), ...(!data.address ? ['Direccion'] : []), ...(!data.hours ? ['Horarios'] : []),
    ...(!data.email && !data.whatsapp ? ['Canal para solicitudes de arrepentimiento'] : []),
    ...(!data.paymentMethods ? ['Medios de pago'] : []),
    ...infoPages.filter(page => !data[`${page.key}Reviewed` as const]).map(page => page.title),
  ]
  return <div className="dashboard business-settings"><header className="dashboard-header"><div><h1>Configuracion del negocio</h1><p>Completa solo informacion confirmada. Los campos vacios no se muestran en la tienda.</p></div></header>
    <p className="settings-warning">Antes de publicar: completa los datos del comercio y los canales de contacto; revisa las condiciones con asesoramiento legal. Al modificar un texto publicado, vuelve a quedar pendiente de revision.</p>
    {pending.length > 0 && <p className="settings-pending"><strong>Pendiente de completar o revisar:</strong> {pending.join(', ')}.</p>}
    <form onSubmit={submit} aria-label="Configuracion del negocio">
      {groups.map(group => <fieldset key={group.title}><legend>{group.title}</legend><div className="settings-grid">{group.fields.map(([key, label]) => <label key={key}>{label}
        {key === 'hours' || key === 'paymentMethods' ? <textarea name={key} maxLength={12000} value={data[key]} onChange={e => setData({ ...data, [key]: e.target.value })} /> : <input name={key} type={key === 'email' ? 'email' : ['mapsUrl','instagram','facebook'].includes(key) ? 'url' : 'text'} maxLength={key === 'whatsapp' ? 15 : 500} pattern={key === 'whatsapp' ? '[0-9]{8,15}' : undefined} value={data[key]} onChange={e => setData({ ...data, [key]: e.target.value })} />}
      </label>)}</div></fieldset>)}
      <fieldset><legend>Paginas informativas</legend><p>Guarda cada texto y, despues de revisarlo, marca la casilla para publicarlo. No incluyas datos o condiciones que no hayas confirmado.</p>
        {infoPages.map(page => { const review = `${page.key}Reviewed` as const; return <div className="settings-document" key={page.key}><label>{page.title}<textarea name={page.key} maxLength={12000} rows={7} value={data[page.key]} onChange={e => setData({ ...data, [page.key]: e.target.value, [review]: false })} /></label><label className="review-check"><input type="checkbox" checked={data[review]} disabled={!data[page.key].trim()} onChange={e => setData({ ...data, [review]: e.target.checked })} />Texto revisado y listo para publicar</label><span>{data[review] ? 'Publicado' : 'Pendiente de revision'}</span></div> })}
      </fieldset>
      {message && <p className="settings-result" role="status">{message}</p>}
      <button disabled={saving} type="submit">{saving ? 'Guardando...' : 'Guardar configuracion'}</button>
    </form></div>
}
