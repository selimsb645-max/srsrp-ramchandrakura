/**
 * The public verification link for a member number — printed on the ID card's QR and on the
 * certificate footer. Built from the current origin + BASE_URL so it keeps working under the
 * GitHub Pages project path and on any future domain.
 */
export function verifyUrlFor(memberCode: string): string {
  const code = memberCode.trim().toUpperCase();
  if (!code) return '';
  return `${window.location.origin}${import.meta.env.BASE_URL}verify/${encodeURIComponent(code)}`;
}
