import { useEffect, useState } from 'react'
import { apiPath } from '../api'
import { emptyBusinessSettings, infoPages } from '../business'
import type { BusinessSettings } from '../business'

export function useBusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettings>(emptyBusinessSettings)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    fetch(apiPath('/api/settings'), { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error('No disponible')
      return response.json() as Promise<{ settings: BusinessSettings }>
    }).then((data) => setSettings({ ...emptyBusinessSettings, ...data.settings })).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true)
    })
    return () => controller.abort()
  }, [])
  return { settings, failed }
}

export function StoreFooter({ settings, hasFloatingCart = false }: { settings: BusinessSettings; hasFloatingCart?: boolean }) {
  const contact = settings.phone || settings.email || settings.whatsapp
  return <footer className={hasFloatingCart ? 'store-footer business-footer has-floating-cart' : 'store-footer business-footer'}>
    <div className="footer-brand"><a href="/" className="footer-wordmark">{settings.businessName || 'rotiseria.'}</a><a className="regret-link" href="/arrepentimiento">Boton de arrepentimiento</a></div>
    <div className="footer-disclosures" role="group" aria-label="Informacion del comercio">
      <details><summary>Local y horarios</summary><div className="footer-detail">
        {settings.address && <p>{settings.address}</p>}
        {settings.mapsUrl && <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer">Ver ubicacion</a>}
        {settings.hours && <p className="preserve-lines">{settings.hours}</p>}
        {!settings.address && !settings.hours && <p>Direccion y horarios pendientes de informar.</p>}
      </div></details>
      <details><summary>Contacto y redes</summary><div className="footer-detail">
        {settings.phone && <p>{settings.phone}</p>}
        {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
        {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
        {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
        {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}
        {!contact && !settings.instagram && !settings.facebook && <p>Contacto pendiente de informar.</p>}
      </div></details>
      <details><summary>Informacion para comprar</summary><div className="footer-detail">
        <nav aria-label="Informacion para comprar">{infoPages.map((page) => <a key={page.key} href={page.path}>{page.title}</a>)}</nav>
        {settings.paymentMethods && <p><strong>Medios de pago:</strong> {settings.paymentMethods}</p>}
        {settings.legalName && <p>{settings.legalName}{settings.taxId ? ` | CUIT: ${settings.taxId}` : ''}</p>}
      </div></details>
    </div>
  </footer>
}
