import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiPath, readError } from '../api'

export function SecurityPanel({ token, onChanged }: { token: string; onChanged: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    if (newPassword !== confirmation) { setMessage('Las contrasenas nuevas no coinciden.'); return }
    setLoading(true)
    try {
      const response = await fetch(apiPath('/api/auth/change-password'), { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) })
      if (!response.ok) throw new Error(await readError(response))
      onChanged()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo cambiar la contrasena') }
    finally { setLoading(false) }
  }
  return <div className="dashboard"><header className="dashboard-header"><div><h1>Seguridad</h1><p>Actualiza la contrasena de tu cuenta.</p></div></header>
    <form className="security-form" onSubmit={submit}>
      <p>Al guardar se cerraran las sesiones abiertas. Vas a tener que ingresar nuevamente.</p>
      <label htmlFor="current-password">Contrasena actual<input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
      <label htmlFor="new-password">Nueva contrasena<input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><span>Minimo 8 caracteres.</span></label>
      <label htmlFor="confirm-password">Repetir nueva contrasena<input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
      {message && <p className="form-message" role="alert">{message}</p>}
      <button disabled={loading} type="submit">{loading ? 'Guardando...' : 'Cambiar contrasena'}</button>
    </form>
  </div>
}
