import nodemailer from "nodemailer";
import type { Briefing, TopicSection } from "@/lib/types";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const SECTION_EMOJIS: Record<string, string> = {
  "PORTFOLIO COMPANY NEWS": "📊",
  "COMPETITOR MOVES": "⚔️",
  "MARKET CONTEXT": "📈",
  "FUNDRAISING & EXITS": "💰",
  "PRODUCT LAUNCHES": "🚀",
  "AI & INFRASTRUCTURE": "🤖",
  "POLICY & REGULATION": "⚖️",
};

function formatBody(body: string, stories: TopicSection["stories"]): string {
  return body
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#111827;">$1</strong>')
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:none;">$1</a>')
    .replace(
      /🔗\s*(.*?):\s*(https?:\/\/\S+)/g,
      (_match, name, url) =>
        `<a href="${url}" style="font-size:13px;color:#6b7280;text-decoration:none;">🔗 ${name} ↗</a>`
    )
    .split(/\n\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<div style="margin-bottom:14px;font-size:15px;line-height:1.75;color:#374151;">${p}</div>`)
    .join("");
}

function sectionToHtml(section: TopicSection, isFirst: boolean): string {
  const emoji = SECTION_EMOJIS[section.label] || "•";

  const divider = isFirst
    ? ""
    : `<div style="margin:32px 0;text-align:center;">
        <div style="border-top:1px solid #e5e7eb;margin:0 40px;"></div>
      </div>`;

  const label = `<div style="margin-bottom:20px;font-size:12px;font-weight:600;color:#9ca3af;letter-spacing:0.5px;">
    ${emoji} ${section.label}
  </div>`;

  const content = section.body
    ? formatBody(section.body, section.stories)
    : section.stories
        .map(
          (s) =>
            `<div style="margin-bottom:18px;">
              <strong style="color:#111827;">${s.headline}</strong>
              <div style="font-size:15px;line-height:1.75;color:#374151;margin-top:4px;">${s.summary}</div>
              ${s.source_url ? `<div style="margin-top:6px;"><a href="${s.source_url}" style="font-size:13px;color:#6b7280;text-decoration:none;">🔗 ${s.source_name || "Source"} ↗</a></div>` : ""}
            </div>`
        )
        .join("");

  return `${divider}${label}${content}`;
}

function buildEmailHtml(briefing: Briefing): string {
  const date = new Date(briefing.briefing_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const opener = briefing.content?.split("\n\n##")[0]?.trim();
  const openerHtml =
    opener && !opener.startsWith("##")
      ? `<div style="font-size:16px;color:#6b7280;line-height:1.75;margin-bottom:28px;font-style:italic;border-left:3px solid #e5e7eb;padding-left:16px;">${opener}</div>`
      : "";

  const sections = briefing.topic_sections
    .map((s, i) => sectionToHtml(s, i === 0))
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    <div style="margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td>
          <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0;">Morning Brief</h1>
          <p style="font-size:13px;color:#9ca3af;margin:4px 0 0;">${date}</p>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <a href="https://morning-brief-gilt.vercel.app/dashboard" style="display:inline-block;padding:8px 16px;font-size:13px;font-weight:600;color:#ffffff;background-color:#111827;border-radius:6px;text-decoration:none;">Read on web ↗</a>
        </td>
      </tr></table>
    </div>
    ${openerHtml}
    ${sections}
    <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        <a href="https://morning-brief-gilt.vercel.app/dashboard/preferences" style="color:#9ca3af;">Manage preferences</a> ·
        <a href="https://morning-brief-gilt.vercel.app/dashboard" style="color:#9ca3af;">Read on web</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendBriefingEmail(
  briefing: Briefing,
  toEmail: string
): Promise<{ success: boolean; error?: string }> {
  const date = new Date(briefing.briefing_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const html = buildEmailHtml(briefing);

  try {
    await transporter.sendMail({
      from: `"Morning Brief" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Morning Brief — ${date}`,
      html,
    });

    return { success: true };
  } catch (err) {
    console.error("[EMAIL] Send failed:", err);
    return { success: false, error: String(err) };
  }
}
