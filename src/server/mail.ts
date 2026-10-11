import "server-only";

import { createTransport, type Transporter } from "nodemailer";

/**
 * Outgoing mail through the support Gmail account. The credentials keep their
 * old (NEXT_PUBLIC_-prefixed) names from the previous app, so they're read
 * straight from process.env here — server only, never imported by the client.
 */
const user = process.env.NEXT_PUBLIC_NODEMAILER_USER;
const pass = process.env.NEXT_PUBLIC_NODEMAILER_PASS;

let transporter: Transporter | null = null;

export const mailConfigured = Boolean(user && pass);

export function mailer() {
  if (!user || !pass) throw new Error("Email isn't configured (NEXT_PUBLIC_NODEMAILER_USER / _PASS).");
  transporter ??= createTransport({ service: "Gmail", auth: { user, pass } });
  return { transporter, from: user };
}

export const SUPPORT_EMAIL = "support@wadzzo.com";
