import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { inviteTeamMemberAction } from '@/app/actions/team'
import { TeamMemberActiveToggle, TeamMemberRoleSelect } from '@/components/admin/team-controls'
import { getDict } from '@/lib/i18n/server'
import type { UserRole } from '@/lib/auth/permissions'

const ROLE_BADGE: Record<string, string> = {
  company_owner:  'bg-amber-50 text-amber-700 border-amber-200',
  company_admin:  'bg-blue-50 text-blue-700 border-blue-200',
  dispatcher:     'bg-purple-50 text-purple-700 border-purple-200',
  accounting:     'bg-teal-50 text-teal-700 border-teal-200',
  driver:         'bg-green-50 text-green-700 border-green-200',
  customer:       'bg-gray-50 text-gray-600 border-gray-200',
}

const inputCls =
  'w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 ' +
  'text-sl-on-surface placeholder:text-sl-on-surface-muted/50 ' +
  'focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze'

export default async function TeamPage() {
  const user = await requireRole('company_owner', 'company_admin')
  const isOwner = user.role === 'company_owner'

  const admin = createAdminClient()
  const { data: members } = await admin
    .from('user_profiles')
    .select('id, first_name, last_name, role, is_active, phone, created_at')
    .eq('company_id', user.company_id!)
    .order('created_at', { ascending: true })

  // void cast — TypeScript void-callback rule
  const teamAction: (fd: FormData) => void = inviteTeamMemberAction
  const t = getDict().admin.team

  return (
    <div className="p-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-playfair font-semibold text-sl-on-surface">{t.title}</h1>
          <p className="mt-1 text-sm text-sl-on-surface-muted">
            {t.subtitle}
          </p>
        </div>
        <span className="text-xs text-sl-on-surface-muted">
          {members?.length ?? 0} {t.members}
        </span>
      </div>

      {/* Invite Form */}
      <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-sl-on-surface mb-4">{t.inviteTitle}</h2>
        <form action={teamAction}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">{t.firstName} *</label>
              <input name="first_name" required placeholder="Jane" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">{t.lastName} *</label>
              <input name="last_name" required placeholder="Smith" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">{t.email} *</label>
              <input name="email" type="email" required placeholder="jane@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">{t.phone}</label>
              <input name="phone" type="tel" placeholder="+1 (555) 000-0000" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">{t.role} *</label>
              <select name="role" required className={inputCls}>
                <option value="">{t.selectRole}</option>
                {isOwner && <option value="company_admin">{t.roles.company_admin}</option>}
                <option value="dispatcher">{t.roles.dispatcher}</option>
                <option value="accounting">{t.roles.accounting}</option>
                <option value="driver">{t.roles.driver}</option>
                <option value="customer">{t.roles.customer}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-gold text-gray-900 rounded-lg hover:bg-gold/90 transition-colors"
            >
              {t.send}
            </button>
          </div>
        </form>
      </div>

      {/* Members Table */}
      {!members || members.length === 0 ? (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-12 text-center">
          <p className="text-sm text-sl-on-surface-muted">{t.empty}</p>
        </div>
      ) : (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sl-outline-variant">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">{t.thMember}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">{t.thRole}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">{t.thStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sl-outline-variant/40">
              {members.map((member) => {
                const isSelf  = member.id === user.id
                const isOwnerRole = member.role === 'company_owner'

                return (
                  <tr key={member.id} className="hover:bg-sl-bg/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-sl-on-surface">
                        {member.first_name} {member.last_name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-sl-on-surface-muted font-normal">{t.you}</span>
                        )}
                      </p>
                      {member.phone && (
                        <p className="text-xs text-sl-on-surface-muted mt-0.5">{member.phone}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {isOwnerRole || isSelf ? (
                        <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_BADGE[member.role] ?? ''}`}>
                          {member.role.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <TeamMemberRoleSelect
                          memberId={member.id}
                          currentRole={member.role as UserRole}
                          roleLabels={t.roles}
                          saving={t.saving}
                        />
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {isOwnerRole || isSelf ? (
                        <span className={`text-xs font-medium ${member.is_active ? 'text-green-700' : 'text-gray-400'}`}>
                          {member.is_active ? t.active : t.inactive}
                        </span>
                      ) : (
                        <TeamMemberActiveToggle
                          memberId={member.id}
                          isActive={member.is_active}
                          labels={{ active: t.active, inactive: t.inactive }}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
