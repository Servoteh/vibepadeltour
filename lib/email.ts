// Email preko Resend HTTP API-ja. Bez RESEND_API_KEY ništa ne šalje (vraća false) —
// ne ruši tok. Čim se doda RESEND_API_KEY (Worker secret), slanje proradi.
//  Env: RESEND_API_KEY, EMAIL_FROM (npr. "Vibe Padel Tour <noreply@vibepadeltour.com>").

const FROM = () => process.env.EMAIL_FROM || "Vibe Padel Tour <onboarding@resend.dev>";

async function send(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false; // tiho preskoči dok nema ključa
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM(), to: [to], subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const shell = (title: string, body: string) => `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#14171f">
    <div style="background:#0b0b0d;color:#e6b84e;padding:16px 20px;border-radius:14px;font-weight:700;letter-spacing:.04em">
      VIBE PADEL TOUR
    </div>
    <h1 style="font-size:20px;margin:24px 0 8px">${title}</h1>
    ${body}
    <p style="margin-top:28px;font-size:12px;color:#5b6170">Vibe Padel Tour · vibepadeltour.com</p>
  </div>`;

export function sendMagicLink(to: string, link: string, teamName?: string): Promise<boolean> {
  const body = `
    <p>${teamName ? `Ekipa <b>${teamName}</b> — ` : ""}ovo je tvoj lični link za podešavanje termina:</p>
    <p style="margin:18px 0">
      <a href="${link}" style="background:#e6b84e;color:#0b0b0d;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">
        Otvori kapiten panel
      </a>
    </p>
    <p style="font-size:13px;color:#5b6170">Ako dugme ne radi, nalepi link: ${link}</p>`;
  return send(to, "Vibe Padel Tour — kapiten link", shell("Tvoj kapiten link", body));
}

export function sendReminder(to: string, when: string, detail: string): Promise<boolean> {
  const body = `<p>Podsetnik za naredno kolo: <b>${when}</b></p><p>${detail}</p>`;
  return send(to, "Vibe Padel Tour — podsetnik za kolo", shell("Podsetnik za kolo", body));
}
