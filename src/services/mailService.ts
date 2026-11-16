/**
 * Organisation mails that are triggered from the admin screens.
 *
 * They go through the same Cloudflare Worker as the password-reset and application-receipt
 * mails (Gmail SMTP, green template), so members always see one consistent identity and never
 * Firebase's fixed template with the old project name.
 */
const MAIL_WORKER = 'https://srsrp-reset-mailer.selimsb645.workers.dev';

/** Bumped by hand so the worker refetches its hosted template after a design change. */
const TEMPLATE_VERSION = '2026-11-16';

export interface ApprovalMailInput {
  email: string;
  name: string;
  memberCode?: string;
}

/**
 * Sends the "your membership was approved" notice. Returns true only when the worker
 * confirms delivery, so the admin screen can tell the committee the truth.
 */
export async function sendApprovalMail(input: ApprovalMailInput): Promise<boolean> {
  const email = input.email?.trim();
  if (!email) return false;
  try {
    const response = await fetch(`${MAIL_WORKER}/approved`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: email.toLowerCase(),
        name: input.name,
        memberCode: input.memberCode ?? '',
        v: TEMPLATE_VERSION,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as { ok?: boolean; sent?: boolean };
    return Boolean(response.ok && result.sent);
  } catch {
    return false;
  }
}
