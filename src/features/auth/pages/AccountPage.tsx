import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ChevronRight, HandHeart, HeartHandshake } from 'lucide-react'

import { AppHeader } from '@/shared/components/AppHeader'
import { Button } from '@/shared/components/Button'
import { TextField } from '@/shared/components/TextField'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCapabilities } from '@/features/help/hooks/useCapabilities'
import { getOwnPhone, saveOwnPhone } from '@/features/help/services/helpService'
import { CapabilityPicker } from '@/features/profile/components/CapabilityPicker'
import { useMyBlocks } from '@/features/profile/hooks/useMyBlocks'
import { getMyCapabilities, saveMyCapabilities } from '@/features/profile/services/profileService'
import { Alert } from '@/shared/components/Alert'
import { Card } from '@/shared/components/Card'

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
  const { capabilities } = useCapabilities()
  const { blocks, loading: blocksLoading, unblock } = useMyBlocks(user?.id ?? null)
  const [capabilityIds, setCapabilityIds] = useState<number[]>([])
  const [savedCapabilityIds, setSavedCapabilityIds] = useState<number[]>([])
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false)
  const [savingCapabilities, setSavingCapabilities] = useState(false)
  const [capabilitiesError, setCapabilitiesError] = useState<string | null>(null)
  const [capabilitiesSaved, setCapabilitiesSaved] = useState(false)

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

  useEffect(() => {
    if (!user) return
    let active = true
    void getMyCapabilities(user.id).then((result) => {
      if (!active) return
      if (result.ok) {
        setCapabilityIds(result.data)
        setSavedCapabilityIds(result.data)
      } else {
        setCapabilitiesError(result.error)
      }
      setCapabilitiesLoaded(true)
    })
    return () => {
      active = false
    }
  }, [user])

  function toggleCapability(id: number) {
    setCapabilitiesSaved(false)
    setCapabilityIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  async function handleSaveCapabilities() {
    if (!user) return
    if (capabilityIds.length === 0) {
      setCapabilitiesError('Elige al menos una forma de participar.')
      return
    }
    setSavingCapabilities(true)
    setCapabilitiesError(null)
    setCapabilitiesSaved(false)
    const result = await saveMyCapabilities(user.id, savedCapabilityIds, capabilityIds)
    setSavingCapabilities(false)
    if (!result.ok) {
      setCapabilitiesError(result.error)
      return
    }
    setSavedCapabilityIds(capabilityIds)
    setCapabilitiesSaved(true)
  }

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
        <h1 className="text-brand-900 text-2xl font-semibold">Mi cuenta</h1>
        <div className="mt-6 flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <div>
              <p className="text-closed-500 text-xs font-medium uppercase">Nombre</p>
              <p className="text-closed-800 mt-1 text-base font-medium">
                {displayName || 'Sin nombre'}
              </p>
            </div>
            <div>
              <p className="text-closed-500 text-xs font-medium uppercase">Correo</p>
              <p className="text-closed-800 mt-1 text-base">{email}</p>
            </div>
            <div className="bg-success-50 text-success-700 mt-2 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm">
              <span className="bg-success-500 size-2 rounded-full" aria-hidden="true" />
              Correo verificado
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <div>
              <p className="text-closed-800 text-base font-medium">Teléfono de contacto</p>
              <p className="text-closed-500 mt-1 text-sm">
                Es privado: solo lo ven las personas con las que tengas una relación de ayuda, y
                queda registrado cada acceso.
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
                  <Button
                    type="button"
                    variant="secondary"
                    loading={savingPhone}
                    onClick={() => void handleSavePhone()}
                  >
                    Guardar teléfono
                  </Button>
                </div>
                {phoneSaved ? <Alert variant="success">Teléfono guardado.</Alert> : null}
              </div>
            ) : (
              <p className="text-closed-500 text-sm">Cargando…</p>
            )}
          </Card>

          {/* Capacidades declaradas (MVP §19, UX §22): multi-selección, no roles. */}
          <Card className="flex flex-col gap-3">
            {capabilitiesLoaded ? (
              <>
                <CapabilityPicker
                  capabilities={capabilities}
                  selectedIds={capabilityIds}
                  onToggle={toggleCapability}
                  disabled={savingCapabilities}
                  legend="Cómo participas"
                  description="Así sabe la comunidad en qué puedes aportar. Puedes cambiarlo cuando quieras."
                  error={capabilitiesError ?? undefined}
                />
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={savingCapabilities}
                    onClick={() => void handleSaveCapabilities()}
                  >
                    Guardar capacidades
                  </Button>
                </div>
                {capabilitiesSaved ? <Alert variant="success">Capacidades guardadas.</Alert> : null}
              </>
            ) : (
              <p className="text-closed-500 text-sm">Cargando…</p>
            )}
          </Card>

          {/* Personas bloqueadas (MVP §21): se gestionan solo desde aquí. */}
          <Card className="flex flex-col gap-3">
            <div>
              <p className="text-closed-800 text-base font-medium">Personas bloqueadas</p>
              <p className="text-closed-500 mt-1 text-sm">
                No se ven contigo en los pedidos de ayuda ni pueden contactarte. La otra persona no
                sabe que la bloqueaste.
              </p>
            </div>
            {blocksLoading ? (
              <p className="text-closed-500 text-sm">Cargando…</p>
            ) : blocks.length === 0 ? (
              <p className="text-closed-500 text-sm">No has bloqueado a nadie.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {blocks.map((person) => (
                  <li
                    key={person.user_id}
                    className="border-arena-200 flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                  >
                    <span className="text-closed-700 text-sm font-medium">
                      {person.display_name}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void unblock(person.user_id)}
                    >
                      Desbloquear
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Acceso al historial de participaciones (MVP §24, UX §5 y §22). */}
          <Card className="flex flex-col gap-2">
            <p className="text-closed-800 text-base font-medium">Mi actividad</p>
            <Link
              to="/my-needs"
              className="border-arena-200 hover:border-brand-300 hover:bg-arena-50 flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
            >
              <span className="text-closed-700 flex items-center gap-2 text-sm font-medium">
                <HeartHandshake className="text-brand-600 size-5" aria-hidden="true" />
                Mis pedidos de ayuda
              </span>
              <ChevronRight className="text-closed-400 size-4" aria-hidden="true" />
            </Link>
            <Link
              to="/my-help"
              className="border-arena-200 hover:border-brand-300 hover:bg-arena-50 flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
            >
              <span className="text-closed-700 flex items-center gap-2 text-sm font-medium">
                <HandHeart className="text-brick-600 size-5" aria-hidden="true" />
                Mis ayudas
              </span>
              <ChevronRight className="text-closed-400 size-4" aria-hidden="true" />
            </Link>
          </Card>

          <Button type="button" variant="danger" loading={signingOut} onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </main>
    </div>
  )
}
