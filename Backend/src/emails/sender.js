const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const ENV = require("../lib/env.js");

function getFromAddress() {
  const fromEmail =
    ENV.EMAIL_FROM ||
    ENV.RESEND_FROM_EMAIL ||
    ENV.SMTP_FROM_EMAIL ||
    ENV.EMAIL_USER;

  const fromName = ENV.EMAIL_FROM_NAME || "Chatify Team";

  if (!fromEmail) {
    return null;
  }

  return `"${fromName}" <${fromEmail}>`;
}

function createSmtpTransporter() {
  if (ENV.SMTP_HOST && ENV.SMTP_PORT && ENV.SMTP_USER && ENV.SMTP_PASS) {
    return nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: Number(ENV.SMTP_PORT),
      secure: Number(ENV.SMTP_PORT) === 465,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    });
  }

  if (ENV.EMAIL_USER && ENV.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
      },
    });
  }

  return null;
}

const resendClient = ENV.RESEND_API_KEY
  ? new Resend(ENV.RESEND_API_KEY)
  : null;

const smtpTransporter = createSmtpTransporter();

async function sendEmail({ to, subject, html }) {
  const from = getFromAddress();

  if (!from) {
    throw new Error(
      "Email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL, or SMTP/EMAIL credentials."
    );
  }

  if (resendClient) {
    await resendClient.emails.send({
      from,
      to,
      subject,
      html,
    });

    return { provider: "resend" };
  }

  if (smtpTransporter) {
    await smtpTransporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    return { provider: "smtp" };
  }

  throw new Error(
    "No email provider is configured. Add RESEND_API_KEY or SMTP credentials."
  );
}

module.exports = {
  sendEmail,
};
