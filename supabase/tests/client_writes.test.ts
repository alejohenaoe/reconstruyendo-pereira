import { execSync } from 'node:child_process'
import { beforeAll, describe, expect, it } from 'vitest'

import { supabase } from '@/shared/lib/supabase'
import { createNeed, attachAddress } from '@/features/needs/services/needPublishService'
import {
  addComment,
  createHelpOffer,
  saveOwnPhone,
  saveResolutionNote,
  updateNeedStatus,
  updateOfferStatus,
} from '@/features/help/services/helpService'
import {
  createReport,
  moderateComment,
  moderateNeed,
} from '@/features/moderation/services/moderationService'
import { saveMyCapabilities } from '@/features/profile/services/profileService'
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  listNotifications,
} from '@/features/notifications/services/notificationsService'

const DB = 'supabase_db_rpbpwwwvakpxzdinvojw'
const PASSWORD = 'Passw0rd!ABC'
const stamp = Date.now()

function sql(statement: string): string {
  return execSync(
    `docker exec ${DB} psql -tA -U postgres -d postgres -c ${JSON.stringify(statement)}`,
    {
      encoding: 'utf8',
    },
  ).trim()
}

/** Crea un usuario verificado y devuelve su id (sin pasar por el correo). */
async function createUser(tag: string): Promise<{ id: string; email: string }> {
  const email = `audit_${tag}_${stamp}@test.local`
  const { data, error } = await supabase.auth.signUp({
    email,
    password: PASSWORD,
    options: { data: { display_name: `Audit ${tag}`, municipality: 'pereira' } },
  })
  if (error) throw new Error(`signUp ${tag}: ${error.message}`)
  const id = data.user?.id as string
  sql(`update auth.users set email_confirmed_at = now() where id = '${id}';`)
  return { id, email }
}

async function signIn(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw new Error(`signIn ${email}: ${error.message}`)
}

let owner: { id: string; email: string }
let helper: { id: string; email: string }
let admin: { id: string; email: string }
let needId: string
let offerId: string
let commentId: string

beforeAll(async () => {
  owner = await createUser('owner')
  helper = await createUser('helper')
  admin = await createUser('admin')
  sql(`update public.profiles set app_role = 'ADMIN' where id = '${admin.id}';`)
})

describe('Escrituras del cliente, tal como las hace el navegador', () => {
  it('createNeed publica el pedido de ayuda', async () => {
    await signIn(owner.email)
    const result = await createNeed(
      {
        title: 'Auditoría del cliente',
        description: 'Descripción suficientemente larga para pasar el check de la tabla.',
        categoryId: 1,
        municipalityId: 1,
        neighborhood: 'Centro',
        needsAssessment: false,
      },
      owner.id,
    )
    expect(result.error).toBeNull()
    expect(result.ok).toBe(true)
    needId = result.data!.id
  })

  it('attachAddress guarda la dirección privada', async () => {
    const result = await attachAddress(needId, 'Calle 10 # 5-20')
    expect(result.error).toBeNull()
    expect(result.ok).toBe(true)
  })

  it('saveOwnPhone guarda el teléfono del dueño', async () => {
    const result = await saveOwnPhone(owner.id, '3001234567')
    expect(result.error).toBeNull()
  })

  it('saveMyCapabilities declara capacidades', async () => {
    const result = await saveMyCapabilities(owner.id, [], [2, 3])
    expect(result.error).toBeNull()
  })

  it('createHelpOffer registra la oferta de quien ayuda', async () => {
    await signIn(helper.email)
    const result = await createHelpOffer(
      needId,
      helper.id,
      2,
      'Puedo ayudar el sábado con la obra.',
    )
    expect(result.error).toBeNull()
    expect(result.ok).toBe(true)
  })

  it('addComment publica en el hilo', async () => {
    const result = await addComment(
      needId,
      helper.id,
      'Puedo pasar el sábado a ver el techo.',
      'COMMENT',
    )
    expect(result.error).toBeNull()
    expect(result.ok).toBe(true)
    commentId = sql(`select id from public.need_comments where need_id = '${needId}' limit 1;`)
  })

  it('addComment con tipo MATERIAL registra la oferta de material', async () => {
    const result = await addComment(
      needId,
      helper.id,
      'Puedo aportar dos bultos de cemento.',
      'MATERIAL',
    )
    expect(result.error).toBeNull()
  })

  it('createReport registra un reporte', async () => {
    const result = await createReport(
      { type: 'need', id: needId, label: 'El pedido de ayuda' },
      helper.id,
      'SPAM',
      'Parece spam.',
    )
    expect(result.error).toBeNull()
    expect(result.ok).toBe(true)
  })

  it('updateOfferStatus avanza la oferta desde el dueño', async () => {
    await signIn(owner.email)
    offerId = sql(`select id from public.help_offers where need_id = '${needId}' limit 1;`)
    if (!offerId) return
    const result = await updateOfferStatus(offerId, 'CONTACTED')
    expect(result.error).toBeNull()
  })

  it('updateNeedStatus mueve el pedido a en proceso', async () => {
    const result = await updateNeedStatus(needId, 'IN_PROGRESS')
    expect(result.error).toBeNull()
    expect(sql(`select status from public.needs where id = '${needId}';`)).toBe('IN_PROGRESS')
  })

  it('updateNeedStatus resuelve guardando la actualización del cierre', async () => {
    const result = await updateNeedStatus(needId, 'RESOLVED', 'Ya quedó. Gracias a todos.')
    expect(result.error).toBeNull()
    expect(sql(`select resolution_note from public.needs where id = '${needId}';`)).toContain(
      'Ya quedó',
    )
  })

  it('saveResolutionNote edita la actualización', async () => {
    const result = await saveResolutionNote(needId, 'Corregido: quedó el sábado.')
    expect(result.error).toBeNull()
    expect(sql(`select resolution_note from public.needs where id = '${needId}';`)).toContain(
      'Corregido',
    )
  })

  it('markNotificationRead / markAll / delete operan sobre la bandeja propia', async () => {
    const page = await listNotifications(null)
    expect(page.error).toBeNull()
    const first = page.ok ? page.data.notifications[0] : null
    if (first) {
      expect((await markNotificationRead(first.id)).error).toBeNull()
      expect((await deleteNotification(first.id)).error).toBeNull()
    }
    expect((await markAllNotificationsRead()).error).toBeNull()
  })

  it('moderateComment oculta un comentario desde el panel', async () => {
    await signIn(admin.email)
    const result = await moderateComment(commentId, true)
    expect(result.error).toBeNull()
    expect(sql(`select is_hidden from public.need_comments where id = '${commentId}';`)).toBe('t')
  })

  it('moderateNeed oculta el pedido desde el panel', async () => {
    const result = await moderateNeed(needId, 'hide')
    expect(result.error).toBeNull()
    expect(sql(`select is_hidden from public.needs where id = '${needId}';`)).toBe('t')
  })
})
