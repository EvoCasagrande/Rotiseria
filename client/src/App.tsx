import './App.css'
import { AdminPage } from './pages/AdminPage'
import { PublicMenuPage } from './pages/PublicMenuPage'

function App() {
  const isAdminPath = window.location.pathname.startsWith('/admin')
  return isAdminPath ? <AdminPage /> : <PublicMenuPage />
}

export default App
