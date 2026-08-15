import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppHeader } from '@/shared/components/AppHeader'
import { Button } from '@/shared/components/Button'
import { TextField } from '@/shared/components/TextField'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getOwnPhone, saveOwnPhone } from '@/features/help/services/helpService'
import { Alert } from '@/shared/components/Alert'

/**
 * Página "Mi cuenta" (UX §22). Muestra datos básicos y el teléfono de
 * contacto (privado, solo visible para personas con relación de ayuda).
 */
export function AccountPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [phone, setPhone] = useState('')
  const [phoneLoaded, setPhoneLoaded] = useState(false)
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneSaved, setPhoneSaved] = useState(false)

  const displayName = String(user?.user_metadata.display_name ?? '')
  const email = user?.email ?? ''

  useEffect(() => {
    if (!user) return
    let active = true
    void getOwnPhone(user.id).then((value) => {
      if (!active) return
      setPhone(value)
      setPhoneLoaded(true)
    })
    return () => {
      active = false
    }
  }, [user])

  async function handleSavePhone() {
    if (!user) return
    const trimmed = phone.trim()
    if (trimmed.length < 6 || trimmed.length > 30) {
      setPhoneError('El teléfono debe tener entre 6 y 30 caracteres.')
      return
    }
    setSavingPhone(true)
    setPhoneError(null)
    setPhoneSaved(false)
    const result = await saveOwnPhone(user.id, trimmed)
    setSavingPhone(false)
    if (!result.ok) {
      setPhoneError(result.error)
      return
    }
    setPhoneSaved(true)
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-closed-800 text-2xl font-semibold">Mi cuenta</h1>
        <div className="mt-6 flex flex-col gap-4">
          <div className="bg-white flex flex-col gap-3 rounded-xl border border-closed-100 p-6 shadow-sm">
            <div>
              <p className="text-closed-500 text-xs font-medium uppercase">Nombre</p>
              <p className="text-closed-800 mt-1 text-base font-medium">{displayName || 'Sin nombre'}</p>
            </div>
            <div>
              <p className="text-closed-500 text-xs font-medium uppercase">Correo</p>
              <p className="text-closed-800 mt-1 text-base">{email}</p>
            </div>
            <div className="bg-success-50 text-success-700 mt-2 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm">
              <span className="size-2 rounded-full bg-success-500" aria-hidden="true" />
              Correo verificado
            </div>
          </div>

          <div className="bg-white flex flex-col gap-3 rounded-xl border border-closed-100 p-6 shadow-sm">
            <div>
              <p className="text-closed-800 text-base font-medium">Teléfono de contacto</p>
              <p className="text-closed-500 mt-1 text-sm">
                Es privado: solo lo ven las personas con las que tengas una relación de ayuda, y queda
                registrado cada acceso.
              </p>
            </div>
            {phoneLoaded ? (
              <div className="flex flex-col gap-2">
                <TextField
                  label="Teléfono"
                  name="phone"
                  inputMode="tel"
                  placeholder="Ej. 300 123 4567"
                  value={phone}
                  error={phoneError ?? undefined}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <div>
                  <Button type="button" variant="secondary" loading={savingPhone} onClick={() => void handleSavePhone()}>
                    Guardar teléfono
                  </Button>
                </div>
                {phoneSaved ? <Alert variant="success">Teléfono guardado.</Alert> : null}
              </div>
            ) : (
              <p className="text-closed-500 text-sm">Cargando…</p>
            )}
          </div>

          <Button type="button" variant="danger" loading={signingOut} onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </main>
    </div>
  )
}
