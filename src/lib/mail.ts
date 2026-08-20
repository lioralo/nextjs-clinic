type MailInput = {
  to: string | string[];
  subject: string;
  text: string;
};

export type MailResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

function recipients(to: string | string[]) {
  return (Array.isArray(to) ? to : [to])
    .map((value) => value.trim())
    .filter(Boolean);
}

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim());
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const to = recipients(input.to);
  if (to.length === 0) {
    return { ok: false, error: "no-recipient" };
  }

  if (!smtpConfigured()) {
    console.info(`[mail skip] ${to.join(", ")} — ${input.subject}`);
    return { ok: true, skipped: true };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "1",
      auth:
        process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD
          ? {
              user: process.env.SMTP_USERNAME,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
    });
    await transporter.sendMail({
      from:
        process.env.SMTP_FROM_EMAIL ??
        process.env.SMTP_USERNAME ??
        "clinic@localhost",
      to,
      subject: input.subject,
      text: input.text,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send-failed";
    console.error("[mail error]", message);
    return { ok: false, error: message };
  }
}
