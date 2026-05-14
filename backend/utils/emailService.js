import nodemailer from 'nodemailer'

// ── Create reusable transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,   // your Gmail address
        pass: process.env.EMAIL_PASS    // 16-char App Password (no spaces)
    }
})

// ── Verify connection on startup (optional, logs to console) ──────────────────
transporter.verify((error) => {
    if (error) {
        console.error('[Email] Transporter error:', error.message)
    } else {
        console.log('[Email] Gmail transporter ready ✅')
    }
})

// ── Format slot date "14_5_2026" → "14 May 2026" ─────────────────────────────
const formatDate = (slotDate) => {
    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const [day, month, year] = slotDate.split('_')
    return `${day} ${months[Number(month)]} ${year}`
}

// ── Send appointment reminder email ──────────────────────────────────────────
export const sendReminderEmail = async ({ toEmail, toName, docName, slotDate, slotTime, appointmentType }) => {
    const dateStr = formatDate(slotDate)
    const typeLabel = appointmentType === 'online' ? '🌐 Online (Video Call)' : '🏥 In-Person (Clinic Visit)'

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
        .wrapper { max-width: 580px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .header { background: #5f6FFF; padding: 28px 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header p  { color: #d0d5ff; margin: 4px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .greeting { font-size: 17px; color: #333; margin-bottom: 16px; }
        .card { background: #f0f4ff; border-left: 4px solid #5f6FFF; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
        .card p { margin: 6px 0; font-size: 14px; color: #444; }
        .card .label { font-weight: bold; color: #5f6FFF; min-width: 130px; display: inline-block; }
        .alert { background: #fff7e6; border: 1px solid #ffd591; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #8a5700; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
        .badge { display: inline-block; background: #5f6FFF; color: #fff; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: bold; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>PRESCRIPTO</h1>
          <p>Appointment Reminder</p>
        </div>
        <div class="body">
          <p class="greeting">Hello <strong>${toName}</strong>,</p>
          <p style="color:#555; font-size:14px;">
            This is a friendly reminder that you have an appointment coming up <strong>in 1 hour</strong>.
            Please be ready on time.
          </p>

          <div class="card">
            <p><span class="label">Doctor</span> Dr. ${docName}</p>
            <p><span class="label">Date</span> ${dateStr}</p>
            <p><span class="label">Time</span> ${slotTime}</p>
            <p><span class="label">Type</span> ${typeLabel}</p>
          </div>

          ${appointmentType === 'online' ? `
          <div class="alert">
            📹 <strong>Online appointment:</strong> Please log in to Prescripto at least 5 minutes early
            and go to <em>My Appointments</em> to join the video call when your doctor starts it.
          </div>` : `
          <div class="alert">
            🏥 <strong>In-person appointment:</strong> Please arrive at the clinic 10 minutes early.
            Don't forget to carry any previous reports or documents.
          </div>`}

          <p style="color:#555; font-size:13px; margin-top:24px;">
            If you need to cancel, please do so from the Prescripto app before your appointment time.
          </p>
        </div>
        <div class="footer">
          This is an automated reminder from Prescripto. Please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
    `

    await transporter.sendMail({
        from:    `"Prescripto" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: `⏰ Reminder: Your appointment with Dr. ${docName} is in 1 hour`,
        html
    })

    console.log(`[Email] Reminder sent to ${toEmail}`)
}