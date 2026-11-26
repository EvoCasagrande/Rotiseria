import './App.css'
import { AdminPage } from './pages/AdminPage'
import { PublicMenuPage } from './pages/PublicMenuPage'
import { InformationPage } from './pages/InformationPage'
import { infoPages } from './business'

function App() {
  const isAdminPath = window.location.pathname.startsWith('/admin')
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const isInformationPage = path === '/arrepentimiento' || infoPages.some(page => page.path === path)
  return isAdminPath ? <AdminPage /> : isInformationPage ? <InformationPage path={path} /> : <PublicMenuPage />
}

export default App
