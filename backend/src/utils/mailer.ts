import nodemailer from 'nodemailer';

export interface EmailAttachment {
  name: string;
  content?: string;
  url?: string;
  cid?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(options: EmailOptions): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const validatedSender =
    process.env.SMTP_FROM_EMAIL ||
    process.env.DEFAULT_ADMIN_EMAIL ||
    'shivamacademy.result@gmail.com';

  const from = process.env.SMTP_FROM || `"Shivam Academy" <${validatedSender}>`;
  const replyTo = process.env.DEFAULT_ADMIN_EMAIL || validatedSender;

  // 1. Try Brevo REST API over HTTPS Port 443 (Immune to Railway's outbound SMTP port blocking)
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();

  if (brevoApiKey) {
    try {
      console.log(`🌐 Dispatching email via Brevo HTTPS REST API (Port 443) to ${options.to}...`);
      const apiRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Shivam Academy', email: validatedSender },
          to: [{ email: options.to }],
          replyTo: { email: replyTo, name: 'Shivam Academy' },
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text,
          ...(options.attachments && options.attachments.length > 0
            ? {
                attachment: options.attachments.map((att) => ({
                  name: att.name,
                  ...(att.content ? { content: att.content } : {}),
                  ...(att.url ? { url: att.url } : {}),
                })),
              }
            : {}),
        }),
      });

      const json: any = await apiRes.json();
      if (apiRes.ok && json.messageId) {
        console.log(`✅ Email sent successfully via Brevo HTTPS API! MessageId: ${json.messageId}`);
        return { sent: true, messageId: json.messageId };
      } else {
        console.warn(`⚠️ Brevo HTTPS API error:`, json);
        return { sent: false, error: json.message || 'Brevo API rejected email' };
      }
    } catch (apiErr: any) {
      console.warn(`⚠️ Brevo HTTPS API attempt failed:`, apiErr.message);
    }
  }

  // 2. Try Resend REST API over HTTPS Port 443
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendApiKey) {
    try {
      console.log(`🌐 Dispatching email via Resend HTTPS REST API to ${options.to}...`);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `"Shivam Academy" <${validatedSender}>`,
          to: [options.to],
          reply_to: replyTo,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const resendJson: any = await resendRes.json();
      if (resendRes.ok && resendJson.id) {
        console.log(`✅ Email sent successfully via Resend HTTPS API! Id: ${resendJson.id}`);
        return { sent: true, messageId: resendJson.id };
      } else {
        console.warn(`⚠️ Resend API responded with error:`, resendJson);
      }
    } catch (resendErr: any) {
      console.warn(`⚠️ Resend API attempt failed:`, resendErr.message);
    }
  }

  // 3. Fallback to standard SMTP (subject to cloud host port timeouts)
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const user = process.env.SMTP_USER || 'c3bf79001@smtp-brevo.com';
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (!pass) {
    console.error('❌ Neither BREVO_API_KEY nor SMTP_PASS configured.');
    return {
      sent: false,
      error: 'Email service not configured. Please add BREVO_API_KEY in Railway Variables.',
    };
  }

  const preferredPort = Number(process.env.SMTP_PORT) || 465;
  const portsToTry = preferredPort === 465 ? [465, 587, 2525] : [preferredPort, 465, 2525, 587];

  let lastError: any = null;

  for (const currentPort of portsToTry) {
    try {
      const isGmail = host === 'smtp.gmail.com';
      const isSecure = currentPort === 465;

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
            connectionTimeout: 6000,
          })
        : nodemailer.createTransport({
            host,
            port: currentPort,
            secure: isSecure,
            auth: { user, pass },
            connectionTimeout: 6000,
            greetingTimeout: 6000,
            socketTimeout: 8000,
            tls: {
              rejectUnauthorized: false,
            },
          });

      const info = await transporter.sendMail({
        from,
        replyTo,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map((att) => ({
          filename: att.name,
          content: att.content ? Buffer.from(att.content, 'base64') : undefined,
          path: att.url,
          cid: att.cid || att.name,
        })),
      });

      console.log(`📧 Email sent successfully to ${options.to} via port ${currentPort} (MessageId: ${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (err: any) {
      lastError = err;
    }
  }

  console.error(`❌ All delivery methods failed for ${options.to}:`, lastError?.message);
  return {
    sent: false,
    error: `Railway network blocked outbound SMTP ports (${lastError?.message || 'Connection timeout'}). Please provide BREVO_API_KEY in Railway Variables for instant HTTPS delivery.`,
  };
}
