/** Motivos de reporte (MVP §26, public.report_reason). */
export type ReportReason =
  'SUSPICIOUS' | 'FALSE_INFO' | 'SPAM' | 'OFFENSIVE' | 'FRAUD' | 'MONEY_REQUEST' | 'OTHER'

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SUSPICIOUS: 'Pedido de ayuda sospechoso',
  FALSE_INFO: 'Información falsa',
  SPAM: 'Spam',
  OFFENSIVE: 'Contenido ofensivo',
  FRAUD: 'Intento de fraude',
  MONEY_REQUEST: 'Solicitud de dinero',
  OTHER: 'Otro',
}

export const REPORT_REASONS: ReportReason[] = [
  'SUSPICIOUS',
  'FALSE_INFO',
  'SPAM',
  'OFFENSIVE',
  'FRAUD',
  'MONEY_REQUEST',
  'OTHER',
]

/** Estados de un reporte (public.report_status). */
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED'

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Pendiente',
  REVIEWED: 'Revisado',
  ACTIONED: 'Atendido',
  DISMISSED: 'Descartado',
}

export const REPORT_STATUSES: ReportStatus[] = ['PENDING', 'REVIEWED', 'ACTIONED', 'DISMISSED']

export type ReportTargetType = 'need' | 'comment' | 'user'

export interface ReportTarget {
  type: ReportTargetType
  id: string
  /** Texto corto que describe lo que se reporta (lo arma quien dispara el reporte). */
  label: string
}

/** Fila del reporte (solo el reportero y los admins la ven por RLS). */
export interface Report {
  id: string
  reporter_id: string
  need_id: string | null
  comment_id: string | null
  reported_user_id: string | null
  reason: ReportReason
  details: string | null
  status: ReportStatus
  moderated_by: string | null
  created_at: string
  resolved_at: string | null
  need: { title: string } | null
  comment: { body: string } | null
}

/** Reporte enriquecido para el panel admin (target + autor). */
export interface ReportView extends Report {
  reporter_name: string
  target_label: string
}

export type AppRole = 'USER' | 'ADMIN'

export interface AdminUser {
  id: string
  display_name: string
  municipality_id: number | null
  app_role: AppRole
  banned_at: string | null
  created_at: string
  municipalities: { name: string } | null
}

export interface AdminNeed {
  id: string
  title: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  is_hidden: boolean
  hidden_at: string | null
  created_at: string
  owner_name: string | null
}

export interface AdminStats {
  users: number
  users_banned: number
  needs: number
  needs_by_status: Record<string, number>
  needs_hidden: number
  offers: number
  comments: number
  reports_pending: number
}

export type ModResult<T> =
  { ok: true; data: T; error: null } | { ok: false; data: null; error: string }
