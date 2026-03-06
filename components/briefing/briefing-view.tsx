"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Morning Brief</h2>
        <p className="text-muted-foreground">{formatted}</p>
      </div>

      <div className="space-y-8">
        {briefing.topic_sections.map((section, si) => (
          <div key={section.topic}>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-sm">
                {section.stories[0]?.emoji} {section.label}
              </Badge>
            </div>
            <div className="space-y-6">
              {section.stories.map((story, i) => (
                <StoryCard key={i} story={story} briefingId={briefing.id} />
              ))}
            </div>
            {si < briefing.topic_sections.length - 1 && <Separator className="mt-8" />}
          </div>
        ))}
      </div>
    </div>
  );
}
