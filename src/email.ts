// Transactionele e-mail via Resend (RESEND_API_KEY env).
// Eén huisstijl voor alle apps: donkere kaart, serif kop, accentknop.

export interface ResetEmailOpts {
  to: string
  resetUrl: string
  appName: string          // bijv. 'Ludoryn' of 'Flights'
  from?: string            // default: "<appName> <noreply@ludoryn.com>" — pas aan per geverifieerd domein
  accent?: string          // knopkleur, default huisstijl-paars
}

export async function sendPasswordResetEmail(opts: ResetEmailOpts) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const accent = opts.accent ?? '#7c6fcd'
  await resend.emails.send({
    from: opts.from ?? `${opts.appName} <onboarding@resend.dev>`,
    to: opts.to,
    subject: `Reset your ${opts.appName} password`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#1a1d2e;color:#e8e0d0;border-radius:8px">
        <h1 style="font-size:24px;margin:0 0 8px;color:#e8e0d0">Password reset</h1>
        <p style="margin:0 0 24px;color:#a09880;font-size:15px">Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${opts.resetUrl}" style="display:inline-block;background:${accent};color:#fff;padding:14px 28px;border-radius:4px;text-decoration:none;font-weight:600;font-size:15px">Reset password</a>
        <p style="margin:32px 0 0;color:#6b6458;font-size:13px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}
