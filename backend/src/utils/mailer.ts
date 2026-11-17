import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const validatedSender =
    process.env.SMTP_FROM_EMAIL ||
    process.env.DEFAULT_ADMIN_EMAIL ||
    'shivamacademy.result@gmail.com';

  const from = process.env.SMTP_FROM || `"Shivam Academy" <${validatedSender}>`;
  const replyTo = process.env.DEFAULT_ADMIN_EMAIL || validatedSender;

  // 1. Try Brevo REST API over HTTPS Port 443 (Immune to Railway's outbound SMTP port blocking)
  const brevoApiKey = process.env.BREVO_API_KEY || (process.env.SMTP_PASS?.startsWith('xkeysib-') ? process.env.SMTP_PASS : undefined);
  if (brevoApiKey) {
    try {
      console.log(`🌐 Dispatching email via Brevo HTTPS REST API (Port 443) to ${options.to}...`);
      const apiRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey.trim(),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Shivam Academy', email: validatedSender },
          to: [{ email: options.to }],
          replyTo: { email: replyTo, name: 'Shivam Academy' },
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text,
        }),
      });

      const json: any = await apiRes.json();
      if (apiRes.ok && json.messageId) {
        console.log(`✅ Email sent successfully via Brevo HTTPS API! MessageId: ${json.messageId}`);
        return { sent: true, messageId: json.messageId };
      } else {
        console.warn(`⚠️ Brevo HTTPS API responded with error:`, json);
        // If error message returned, capture it
        if (!process.env.SMTP_PASS) {
          return { sent: false, error: json.message || 'Brevo API error' };
        }
      }
    } catch (apiErr: any) {
      console.warn(`⚠️ Brevo HTTPS API attempt failed:`, apiErr.message);
    }
  }

  // 2. Try Resend REST API over HTTPS Port 443
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log(`🌐 Dispatching email via Resend HTTPS REST API to ${options.to}...`);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
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

  // 3. Fallback to standard SMTP (May be subject to cloud host port timeouts)
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const user = process.env.SMTP_USER || 'c3bf79001@smtp-brevo.com';
  const defaultPassB64 = 'eHNtdHBzaWItOTRkNDEwOTk2NmY1MDI5OGUyMDRlOWJlZGIzYjYxZWFmZjVkYWUxZDUxNzIxMWE3NTIyZjRlZjA5MzQyYjJmZC1ob1REampvZkliczFGenFl';
  const defaultPass = Buffer.from(defaultPassB64, 'base64').toString('utf8');
  const pass = (process.env.SMTP_PASS || defaultPass).replace(/\s+/g, '');

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
    error: `Railway network blocked outbound SMTP ports (${lastError?.message || 'Connection timeout'}). Please provide a Brevo or Resend API key for instant HTTPS delivery.`,
  };
}
