import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

export async function sendOtpEmail(to: string, otp: string) {
  try {
    const info = await transporter.sendMail({
      from: `"DOST X - Misamis Oriental" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: 'Your Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #146184; text-align: center; margin-bottom: 8px;">Password Reset</h2>
          <p style="color: #666; text-align: center; font-size: 14px;">Use the code below to reset your password. This code expires in 5 minutes.</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #146184; background: #fff; padding: 16px 32px; border-radius: 8px; border: 2px solid #146184;">
              ${otp}
            </span>
          </div>
          <p style="color: #999; text-align: center; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
    console.log('[EMAIL] Sent:', info.messageId);
  } catch (err) {
    console.error('[EMAIL] Failed:', err);
  }
}
