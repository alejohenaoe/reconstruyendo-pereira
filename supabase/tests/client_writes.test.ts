import { execSync } from 'node:child_process'
import { beforeAll, describe, expect, it } from 'vitest'

import { supabase } from '@/shared/lib/supabase'
import { createNeed, attachAddress } from '@/features/needs/services/needPublishService'
import {
  addComment,
  createHelpOffer,
  getComments,
  getNeedContact,
  getOfferers,
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
import { signIn } from '@/features/auth/services/authService'
import { saveMyCapabilities } from '@/features/profile/services/profileService'
import { blockUser, listMyBlocks, unblockUser } from '@/features/profile/services/blockService'
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

async function session(email: string): Promise<void> {
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
    await session(owner.email)
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
    await session(helper.email)
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
    await session(owner.email)
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
    await session(admin.email)
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

describe('Bloqueo entre personas (MVP §21)', () => {
  // Fixture propio: un pedido visible y una oferta previa al bloqueo. Reutilizar
  // el pedido de los casos anteriores engañaba —estaba oculto por moderación—,
  // así que "no veo sus ofertas" pasaba sin que el bloqueo hiciera nada.
  let neighbor: { id: string; email: string }
  let sharedNeedId: string

  beforeAll(async () => {
    neighbor = await createUser('neighbor')
    await session(neighbor.email)
    const created = await createNeed(
      {
        title: 'Pedido del vecino',
        description: 'Descripción suficientemente larga para pasar el check de la tabla.',
        categoryId: 1,
        municipalityId: 1,
        neighborhood: null,
        needsAssessment: false,
      },
      neighbor.id,
    )
    if (!created.ok) throw new Error(`fixture: ${created.error}`)
    sharedNeedId = created.data.id
    await addComment(sharedNeedId, neighbor.id, 'Mensaje del dueño del pedido.', 'COMMENT')

    await session(helper.email)
    await createHelpOffer(sharedNeedId, helper.id, 2, 'Puedo ayudar con esto el domingo.')
    await addComment(sharedNeedId, helper.id, 'Mensaje de quien ofrece ayuda.', 'COMMENT')
  })

  it('antes del bloqueo cada quien ve al otro', async () => {
    await session(neighbor.email)
    const offerers = await getOfferers(sharedNeedId)
    expect(offerers.data!.some((offer) => offer.user_id === helper.id)).toBe(true)
    const thread = await getComments(sharedNeedId)
    expect(thread.data).toHaveLength(2)
  })

  it('bloquear registra la decisión y repetirlo no molesta a quien pulsa', async () => {
    expect((await blockUser(neighbor.id, helper.id)).error).toBeNull()
    expect((await blockUser(neighbor.id, helper.id)).error).toBeNull()
    expect((await listMyBlocks(neighbor.id)).data).toHaveLength(1)
  })

  it('quien bloquea deja de ver los mensajes y las ofertas de la otra persona', async () => {
    const offerers = await getOfferers(sharedNeedId)
    expect(offerers.error).toBeNull()
    expect(offerers.data!.some((offer) => offer.user_id === helper.id)).toBe(false)
    const thread = await getComments(sharedNeedId)
    expect(thread.data!.map((comment) => comment.user_id)).toEqual([neighbor.id])
  })

  it('el bloqueo es simétrico: la otra persona tampoco lo ve, aunque no se entere', async () => {
    await session(helper.email)
    const thread = await getComments(sharedNeedId)
    expect(thread.data!.map((comment) => comment.user_id)).toEqual([helper.id])
    // Y no puede consultar quién lo bloqueó.
    expect((await listMyBlocks(helper.id)).data).toHaveLength(0)
  })

  it('la persona bloqueada no puede comentar ni ofrecerse en ese pedido', async () => {
    expect(
      (await addComment(sharedNeedId, helper.id, 'Intento comentar de nuevo.', 'COMMENT')).ok,
    ).toBe(false)
    const otro = await createHelpOffer(sharedNeedId, helper.id, 3, 'Intento ofrecerme otra vez.')
    expect(otro.ok).toBe(false)
  })

  it('el contacto deja de revelarse entre las dos personas', async () => {
    const contact = await getNeedContact(sharedNeedId)
    expect(contact.error).toBeNull()
    expect(contact.data).toBeNull()
  })

  it('desbloquear devuelve la visibilidad', async () => {
    await session(neighbor.email)
    expect((await unblockUser(neighbor.id, helper.id)).error).toBeNull()
    expect((await listMyBlocks(neighbor.id)).data).toHaveLength(0)
    const offerers = await getOfferers(sharedNeedId)
    expect(offerers.data!.some((offer) => offer.user_id === helper.id)).toBe(true)
    const thread = await getComments(sharedNeedId)
    expect(thread.data).toHaveLength(2)
  })

  it('nadie puede bloquearse a sí mismo', async () => {
    expect((await blockUser(neighbor.id, neighbor.id)).ok).toBe(false)
  })

  it('no se puede registrar un bloqueo a nombre de otra persona', async () => {
    expect((await blockUser(helper.id, admin.id)).ok).toBe(false)
  })
})

describe('Registro y entrada en un solo paso (ARCH §7.2.1)', () => {
  it('el registro deja sesión abierta, sin pasar por el correo', async () => {
    const email = `audit_direct_${stamp}@test.local`
    const { data, error } = await supabase.auth.signUp({
      email,
      password: PASSWORD,
      options: { data: { display_name: 'Audit Directa', municipality: 'pereira' } },
    })
    expect(error).toBeNull()
    expect(data.session).not.toBeNull()
    expect(data.user?.email_confirmed_at).toBeTruthy()
  })

  it('una cuenta sin confirmar recibe un motivo entendible al entrar (UX §20, §25)', async () => {
    // La autoconfirmación no llega a las cuentas creadas antes del cambio, y Supabase
    // sigue rechazando su login: por eso /verify-email y este código se conservan.
    const email = `audit_unverified_${stamp}@test.local`
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: PASSWORD,
      options: { data: { display_name: 'Audit Sin Verificar', municipality: 'pereira' } },
    })
    expect(signUpError).toBeNull()
    sql(`update auth.users set email_confirmed_at = null where id = '${data.user?.id}';`)

    // La interfaz necesita el código para ofrecer "reenviar el enlace" en lugar
    // de un error genérico.
    const result = await signIn(email, PASSWORD)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('email_not_confirmed')
    expect(result.error).toContain('correo')
  })
})
