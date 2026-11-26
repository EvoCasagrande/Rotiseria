import { infoPages } from '../business'
import { StoreFooter, useBusinessSettings } from '../components/StoreFooter'

export function InformationPage({ path }: { path: string }) {
  const { settings, failed } = useBusinessSettings()
  const page = infoPages.find((item) => item.path === path)
  const isRegret = path === '/arrepentimiento'
  const title = isRegret ? 'Boton de arrepentimiento' : page?.title ?? 'Pagina no encontrada'
  return <main className="public-shell information-shell">
    <nav className="store-nav" aria-label="Navegacion principal"><a className="store-brand" href="/">rotiseria<span>cocina de barrio</span></a><a className="info-back" href="/">Volver al menu</a></nav>
    <article className="information-page"><a className="information-back" href="/">&larr; Volver al menu</a><h1>{title}</h1>
      {failed ? <p role="alert">No pudimos cargar esta informacion. Intenta nuevamente mas tarde.</p> : isRegret ? <>
        <p>Para solicitar la revocacion de una compra, contacta al comercio e indica los datos de tu pedido.</p>
        {settings.email && <p><a href={`mailto:${settings.email}?subject=Solicitud%20de%20arrepentimiento`}>Enviar solicitud por email</a></p>}
        {settings.whatsapp && <p><a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent('Quiero solicitar el arrepentimiento de mi pedido.')}`} target="_blank" rel="noopener noreferrer">Enviar solicitud por WhatsApp</a></p>}
        {!settings.email && !settings.whatsapp && <p>El canal para recibir solicitudes esta pendiente de configuracion por el comercio.</p>}
      </> : page ? page && settings[page.key] ? <div className="information-copy">{settings[page.key]}</div> : <p>Esta informacion esta pendiente de publicacion por el comercio.</p> : <p>La pagina solicitada no existe.</p>}
    </article><StoreFooter settings={settings} />
  </main>
}
