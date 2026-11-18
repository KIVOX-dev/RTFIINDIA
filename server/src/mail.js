// Brevo transactional email. A no-op (returns false) when Brevo is not configured.
export async function sendMail({ to, subject, text }) {
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL } = process.env;
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !to) return false;
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ sender: { email: BREVO_SENDER_EMAIL, name: 'RTF website' }, to: [{ email: to }], subject, textContent: text }),
    });
    if (!res.ok) console.warn('[brevo] HTTP', res.status);
    return res.ok;
  } catch (e) {
    console.warn('[brevo]', e.message);
    return false;
  }
}
export const mailConfigured = () => !!(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
