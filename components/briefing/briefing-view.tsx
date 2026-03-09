"use client";

import ReactMarkdown from "react-markdown";
import type { Briefing } from "@/lib/types";

export function BriefingView({ briefing }: { briefing: Briefing }) {
  const date = new Date(briefing.briefing_date);
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Extract opener from content (first line before ## sections)
  const opener = briefing.content?.split("\n\n##")[0]?.trim();

  return (
    <article className="max-w-2xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Morning Brief</h1>
        <p className="text-sm text-muted-foreground mt-1">{formatted}</p>
      </header>

      {opener && !opener.startsWith("##") && (
        <p className="text-lg text-foreground/70 mb-10 leading-relaxed">
          {opener}
        </p>
      )}

      <div className="space-y-10">
        {briefing.topic_sections.map((section) => (
          <section key={section.topic}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 border-b pb-2">
              {section.label}
            </h2>
            {section.body ? (
              <div className="briefing-body">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="text-[15px] leading-relaxed text-foreground/90 mb-4">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-foreground font-semibold">{children}</strong>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {children}
                      </a>
                    ),
                    em: ({ children }) => (
                      <em className="text-foreground/70">{children}</em>
                    ),
                  }}
                >
                  {section.body}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="space-y-4">
                {section.stories.map((story, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-foreground/90">
                    <strong className="text-foreground">{story.headline}</strong>
                    {story.summary && <> — {story.summary}</>}
                    {story.source_url && (
                      <a
                        href={story.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline ml-1 text-sm"
                      >
                        ({story.source_name})
                      </a>
                    )}
                  </p>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
