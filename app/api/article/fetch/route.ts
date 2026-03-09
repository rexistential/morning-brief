import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    // Fetch the article content via a simple HTML fetch + extract
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MorningBrief/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch article" }, { status: 502 });
    }

    const html = await res.text();

    // Simple content extraction — strip tags, get main text
    const content = extractArticleText(html);

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Article fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}

function extractArticleText(html: string): string {
  // Remove script, style, nav, header, footer tags and their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");

  // Try to find article or main content
  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const contentDiv = text.match(/<div[^>]*class="[^"]*(?:article|content|post|entry|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  const targetHtml = articleMatch?.[1] || mainMatch?.[1] || contentDiv?.[1] || text;

  // Convert paragraphs to newlines, strip remaining tags
  const cleaned = targetHtml
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Limit to ~3000 chars to keep it readable
  if (cleaned.length > 3000) {
    return cleaned.slice(0, 3000) + "…";
  }

  return cleaned || "Could not extract article content.";
}
