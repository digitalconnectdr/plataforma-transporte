import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import {
  updateCompanyInfoAction,
  updateBookingSettingsAction,
  updateGratuitySettingsAction,
} from '@/app/actions/settings'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Santo_Domingo', 'America/Puerto_Rico', 'Europe/London', 'Europe/Madrid',
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'DOP', 'MXN', 'COP', 'ARS', 'BRL']

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'MX', name: 'Mexico' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
]

const inputCls =
  'w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 ' +
  'text-sl-on-surface placeholder:text-sl-on-surface-muted/50 ' +
  'focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold'

const labelCls = 'block text-xs text-sl-on-surface-muted mb-1'

export default async function SettingsPage() {
  const user = await requireRole('company_owner')
  if (!user.company_id) return <p className="p-8 text-sl-on-surface-muted">Sin empresa asignada.</p>

  const admin = createAdminClient()
  const { data: company } = await admin
    .from('companies')
    .select('name, phone, email, address, city, country, timezone, currency, settings')
    .eq('id', user.company_id)
    .single()

  if (!company) return <p className="p-8 text-sl-on-surface-muted">Empresa no encontrada.</p>

  const settings = (company.settings as {
    booking?: {
      advance_booking_hours?: number
      max_advance_days?: number
      allow_instant_booking?: boolean
      require_deposit?: boolean
      deposit_percentage?: number
    }
    gratuity?: {
      enabled?: boolean
      default_percentage?: number
    }
  }) ?? {}

  const booking  = settings.booking  ?? {}
  const gratuity = settings.gratuity ?? {}

  // void casts — TypeScript void-callback rule
  const infoAction:     (fd: FormData) => void = updateCompanyInfoAction
  const bookingAction:  (fd: FormData) => void = updateBookingSettingsAction
  const gratuityAction: (fd: FormData) => void = updateGratuitySettingsAction

  return (
    <div className="p-8 max-w-3xl space-y-8">

      <div>
        <h1 className="text-2xl font-playfair font-semibold text-sl-on-surface">Settings</h1>
        <p className="mt-1 text-sm text-sl-on-surface-muted">Manage your company profile and platform preferences.</p>
      </div>

      {/* ── Company Information ── */}
      <section className="bg-sl-surface border border-sl-outline-variant rounded-xl p-6">
        <h2 className="text-sm font-semibold text-sl-on-surface mb-5">Company Information</h2>
        <form action={infoAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Company Name *</label>
              <input name="name" required defaultValue={company.name} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input name="phone" type="tel" defaultValue={company.phone ?? ''} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input name="email" type="email" defaultValue={company.email ?? ''} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Address</label>
              <input name="address" defaultValue={company.address ?? ''} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input name="city" defaultValue={company.city ?? ''} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <select name="country" defaultValue={company.country ?? 'US'} className={inputCls}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Timezone</label>
              <select name="timezone" defaultValue={company.timezone ?? 'America/New_York'} className={inputCls}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select name="currency" defaultValue={company.currency ?? 'USD'} className={inputCls}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" className="px-4 py-2 text-sm font-medium bg-gold text-gray-900 rounded-lg hover:bg-gold/90 transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </section>

      {/* ── Booking Settings ── */}
      <section className="bg-sl-surface border border-sl-outline-variant rounded-xl p-6">
        <h2 className="text-sm font-semibold text-sl-on-surface mb-5">Booking Settings</h2>
        <form action={bookingAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Min. Advance Booking (hours)</label>
              <input
                name="advance_booking_hours"
                type="number"
                min="0"
                defaultValue={booking.advance_booking_hours ?? 2}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Max. Advance Booking (days)</label>
              <input
                name="max_advance_days"
                type="number"
                min="1"
                defaultValue={booking.max_advance_days ?? 90}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                name="allow_instant_booking"
                type="checkbox"
                value="true"
                defaultChecked={booking.allow_instant_booking ?? true}
                className="w-4 h-4 rounded accent-gold"
              />
              <span className="text-sm text-sl-on-surface">Allow instant booking (no confirmation required)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                name="require_deposit"
                type="checkbox"
                value="true"
                defaultChecked={booking.require_deposit ?? false}
                className="w-4 h-4 rounded accent-gold"
              />
              <span className="text-sm text-sl-on-surface">Require deposit at booking</span>
            </label>
          </div>

          {booking.require_deposit && (
            <div className="w-48">
              <label className={labelCls}>Deposit Percentage (%)</label>
              <input
                name="deposit_percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue={booking.deposit_percentage ?? 0}
                className={inputCls}
              />
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button type="submit" className="px-4 py-2 text-sm font-medium bg-gold text-gray-900 rounded-lg hover:bg-gold/90 transition-colors">
              Save Booking Settings
            </button>
          </div>
        </form>
      </section>

      {/* ── Gratuity Settings ── */}
      <section className="bg-sl-surface border border-sl-outline-variant rounded-xl p-6">
        <h2 className="text-sm font-semibold text-sl-on-surface mb-5">Gratuity</h2>
        <form action={gratuityAction} className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              name="enabled"
              type="checkbox"
              value="true"
              defaultChecked={gratuity.enabled ?? true}
              className="w-4 h-4 rounded accent-gold"
            />
            <span className="text-sm text-sl-on-surface">Enable gratuity options at checkout</span>
          </label>
          <div className="w-48">
            <label className={labelCls}>Default Gratuity (%)</label>
            <input
              name="default_percentage"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={gratuity.default_percentage ?? 20}
              className={inputCls}
            />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" className="px-4 py-2 text-sm font-medium bg-gold text-gray-900 rounded-lg hover:bg-gold/90 transition-colors">
              Save Gratuity Settings
            </button>
          </div>
        </form>
      </section>

    </div>
  )
}
