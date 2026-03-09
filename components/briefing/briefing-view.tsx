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

  const opener = briefing.content?.split("\n\n##")[0]?.trim();

  return (
    <article className="max-w-2xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Morning Brief</h1>
        <p className="text-sm text-muted-foreground mt-1">{formatted}</p>
      </header>

      {opener && !opener.startsWith("##") && (
        <p className="text-base text-foreground/60 mb-10 leading-relaxed">
          {opener}
        </p>
      )}

      <div className="space-y-10">
        {briefing.topic_sections.map((section) => (
          <section key={section.topic}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5 border-b border-border/50 pb-2">
              {section.label}
            </h2>

            {section.body ? (
              <div>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="text-[15px] leading-[1.75] text-foreground/85 mb-5">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-foreground font-semibold">{children}</strong>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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

                {/* Source links */}
                {section.stories.some(s => s.source_url) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {section.stories.filter(s => s.source_url).map((s, i) => (
                      <a
                        key={i}
                        href={s.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      >
                        {s.source_name} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {section.stories.map((story, i) => (
                  <div key={i}>
                    <p className="text-[15px] leading-[1.75] text-foreground/85">
                      <strong className="text-foreground">{story.headline}</strong>
                      <br />
                      {story.summary}
                    </p>
                    {story.source_url && (
                      <a
                        href={story.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground/50 hover:text-muted-foreground"
                      >
                        {story.source_name} ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
