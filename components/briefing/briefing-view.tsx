"use client";

import { StoryCard } from "./story-card";
import type { Briefing } from "@/lib/types";

export function BriefingView({ briefing }: { briefing: Briefing }) {
  const date = new Date(briefing.briefing_date);
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Extract opener from content (first line before the ## sections)
  const opener = briefing.content?.split("\n\n##")[0]?.trim();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Morning Brief ☀️</h2>
        <p className="text-sm text-muted-foreground mt-1">{formatted}</p>
      </div>

      {opener && !opener.startsWith("##") && (
        <p className="text-base text-foreground/70 mb-8">
          {opener}
        </p>
      )}

      <div className="space-y-10">
        {briefing.topic_sections.map((section) => (
          <div key={section.topic}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">
              {section.stories[0]?.emoji} {section.label}
            </h3>
            <div className="space-y-6">
              {section.stories.map((story, i) => (
                <StoryCard key={i} story={story} briefingId={briefing.id} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
