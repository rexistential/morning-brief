import nodemailer from "nodemailer";
import type { Briefing, TopicSection } from "@/lib/types";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function sectionToHtml(section: TopicSection): string {
  const sourcesHtml = section.body && section.stories.length > 0
    ? `<div style="margin-top:12px;font-size:12px;color:#9ca3af;">Sources: ${
        section.stories
          .filter(s => s.source_url)
          .map(s => `<a href="${s.source_url}" style="color:#9ca3af;text-decoration:none;">${s.source_name || "Source"} ↗</a>`)
          .join(" · ")
      }</div>`
    : "";

  const stories = section.body
    ? `<div style="font-size:15px;line-height:1.75;color:#374151;">${section.body
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:none;">$1</a>')
        .replace(/\n\n/g, "</div><div style=\"font-size:15px;line-height:1.75;color:#374151;margin-top:12px;\">")
      }</div>${sourcesHtml}`
    : section.stories
        .map(
          (s) =>
            `<div style="margin-bottom:16px;">
              <strong style="color:#111827;">${s.headline}</strong><br/>
              <span style="font-size:15px;color:#374151;line-height:1.75;">${s.summary}</span>
              ${s.source_url ? `<br/><a href="${s.source_url}" style="font-size:12px;color:#9ca3af;text-decoration:none;">${s.source_name || "Source"} ↗</a>` : ""}
            </div>`
        )
        .join("");

  return `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:16px;">
        ${section.label}
      </h2>
      ${stories}
    </div>
  `;
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
      ? `<p style="font-size:15px;color:#6b7280;line-height:1.75;margin-bottom:32px;">${opener}</p>`
      : "";

  const sections = briefing.topic_sections.map(sectionToHtml).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:700;color:#111827;margin:0;">Morning Brief</h1>
      <p style="font-size:13px;color:#9ca3af;margin:4px 0 0;">${date}</p>
    </div>
    ${openerHtml}
    ${sections}
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;">
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
