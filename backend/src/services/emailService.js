// backend/src/services/emailService.js
const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev'
const APP_NAME = 'ReachFlow'
const APP_URL = 'https://reachflowbd.com'

if (!process.env.RESEND_API_KEY) {
  console.error('⚠️  RESEND_API_KEY is not set — emails will fail to send.')
}
if (!process.env.FROM_EMAIL) {
  console.warn('⚠️  FROM_EMAIL not set, falling back to onboarding@resend.dev')
}

// ─────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html })
    if (result?.error) {
      console.error('Resend API returned an error:', JSON.stringify(result.error))
      throw new Error(result.error.message || 'Resend send failed')
    }
    console.log(`✅ Email sent to ${to} (id: ${result?.data?.id || 'unknown'})`)
    return result
  } catch (err) {
    console.error('❌ Email error:', err?.message || err)
    throw err
  }
}

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0b0f; margin: 0; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #1a1b23; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
    .header { background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
    .body { padding: 32px; color: #e5e7eb; }
    .body p { margin: 0 0 16px; line-height: 1.6; font-size: 15px; }
    .amount { font-size: 32px; font-weight: 700; color: #10b981; text-align: center; margin: 24px 0; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .badge-green { background: rgba(16,185,129,0.1); color: #10b981; }
    .badge-red { background: rgba(239,68,68,0.1); color: #ef4444; }
    .badge-yellow { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .btn { display: block; width: fit-content; margin: 24px auto 0; padding: 12px 28px; background: #7c3aed; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; }
    .footer { padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; color: #6b7280; font-size: 13px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; }
    .info-label { color: #9ca3af; }
    .info-value { color: #e5e7eb; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ ${APP_NAME}</h1>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} ${APP_NAME} · <a href="${APP_URL}" style="color: #7c3aed;">Visit Platform</a></div>
  </div>
</body>
</html>
`

// ─────────────────────────────────────────
// WITHDRAWAL EMAILS
// ─────────────────────────────────────────

const sendWithdrawalRequestEmail = async (to, name, amount, method) => {
  const html = baseTemplate(`
    <p>হ্যালো <strong>${name}</strong>,</p>
    <p>তোমার withdrawal request সফলভাবে submit হয়েছে। Admin শীঘ্রই review করবে।</p>
    <div class="amount">$${amount}</div>
    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; margin: 16px 0;">
      <div class="info-row"><span class="info-label">Method</span><span class="info-value">${method}</span></div>
      <div class="info-row"><span class="info-label">Amount</span><span class="info-value">$${amount}</span></div>
      <div class="info-row" style="border:none"><span class="info-label">Status</span><span class="badge badge-yellow">Pending</span></div>
    </div>
    <p style="color: #9ca3af; font-size: 13px;">সাধারণত ১-৩ business day এর মধ্যে process হয়।</p>
    <a href="${APP_URL}/dashboard/promoter/withdrawal" class="btn">Withdrawal Status দেখো</a>
  `)
  await sendEmail(to, `💸 Withdrawal Request Received - $${amount}`, html)
}

const sendWithdrawalApprovedEmail = async (to, name, amount, method) => {
  const html = baseTemplate(`
    <p>হ্যালো <strong>${name}</strong>,</p>
    <p>🎉 তোমার withdrawal request <strong>approve</strong> হয়েছে! Payment পাঠানো হয়েছে।</p>
    <div class="amount">$${amount}</div>
    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; margin: 16px 0;">
      <div class="info-row"><span class="info-label">Method</span><span class="info-value">${method}</span></div>
      <div class="info-row"><span class="info-label">Amount</span><span class="info-value">$${amount}</span></div>
      <div class="info-row" style="border:none"><span class="info-label">Status</span><span class="badge badge-green">Approved ✓</span></div>
    </div>
    <a href="${APP_URL}/dashboard/promoter/withdrawal" class="btn">Withdrawal History দেখো</a>
  `)
  await sendEmail(to, `✅ Withdrawal Approved - $${amount}`, html)
}

const sendWithdrawalRejectedEmail = async (to, name, amount, note) => {
  const html = baseTemplate(`
    <p>হ্যালো <strong>${name}</strong>,</p>
    <p>দুঃখিত, তোমার $${amount} withdrawal request reject হয়েছে।</p>
    ${note ? `<div style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 16px; margin: 16px 0; color: #fca5a5;">কারণ: ${note}</div>` : ''}
    <p>টাকা তোমার wallet এ ফেরত দেওয়া হয়েছে। আবার চেষ্টা করতে পারো।</p>
    <a href="${APP_URL}/dashboard/promoter/withdrawal" class="btn">আবার Request করো</a>
  `)
  await sendEmail(to, `❌ Withdrawal Rejected - $${amount}`, html)
}

// ─────────────────────────────────────────
// SUBMISSION EMAILS
// ─────────────────────────────────────────

const sendSubmissionApprovedEmail = async (to, name, campaignTitle, amount) => {
  const html = baseTemplate(`
    <p>হ্যালো <strong>${name}</strong>,</p>
    <p>🎉 তোমার submission <strong>approve</strong> হয়েছে!</p>
    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; margin: 16px 0;">
      <div class="info-row"><span class="info-label">Campaign</span><span class="info-value">${campaignTitle}</span></div>
      <div class="info-row" style="border:none"><span class="info-label">Earned</span><span class="info-value" style="color: #10b981; font-size: 18px;">$${amount}</span></div>
    </div>
    <p>টাকা তোমার wallet এ add হয়ে গেছে।</p>
    <a href="${APP_URL}/dashboard/promoter/earnings" class="btn">Earnings দেখো</a>
  `)
  await sendEmail(to, `🎉 Submission Approved - $${amount} Earned!`, html)
}

const sendSubmissionRejectedEmail = async (to, name, campaignTitle) => {
  const html = baseTemplate(`
    <p>হ্যালো <strong>${name}</strong>,</p>
    <p>দুঃখিত, "<strong>${campaignTitle}</strong>" campaign এর তোমার submission reject হয়েছে।</p>
    <p>অন্য campaign এ apply করে আবার চেষ্টা করো।</p>
    <a href="${APP_URL}/dashboard/promoter/campaigns" class="btn">Campaign Browse করো</a>
  `)
  await sendEmail(to, `❌ Submission Rejected - ${campaignTitle}`, html)
}

// ─────────────────────────────────────────
// APPLICATION EMAILS
// ─────────────────────────────────────────

const sendApplicationApprovedEmail = async (to, name, campaignTitle) => {
  const html = baseTemplate(`
    <p>হ্যালো <strong>${name}</strong>,</p>
    <p>🎉 তোমার application <strong>approve</strong> হয়েছে!</p>
    <div style="background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: #c4b5fd; font-weight: 600;">${campaignTitle}</p>
    </div>
    <p>এখন tracking link নাও এবং promote শুরু করো!</p>
    <a href="${APP_URL}/dashboard/promoter" class="btn">Dashboard এ যাও</a>
  `)
  await sendEmail(to, `✅ Application Approved - ${campaignTitle}`, html)
}

const sendVerificationEmail = async (to, name, token) => {
  const verifyUrl = `${process.env.BACKEND_URL || 'https://reachflow-j34o.onrender.com'}/api/auth/verify-email?token=${token}`
  const html = baseTemplate(`
    <p>হ্যালো <strong>${name}</strong>,</p>
    <p>ReachFlow এ স্বাগতম! তোমার account verify করতে নিচের button এ click করো।</p>
    <a href="${verifyUrl}" class="btn">✅ Email Verify করো</a>
    <p style="color: #9ca3af; font-size: 13px; margin-top: 16px;">এই link ২৪ ঘন্টা valid থাকবে।</p>
  `)
  await sendEmail(to, `✅ ReachFlow - Email Verify করো`, html)
}

module.exports = {
  sendWithdrawalRequestEmail,
  sendWithdrawalApprovedEmail,
  sendWithdrawalRejectedEmail,
  sendSubmissionApprovedEmail,
  sendSubmissionRejectedEmail,
  sendApplicationApprovedEmail,
  sendVerificationEmail,
}
