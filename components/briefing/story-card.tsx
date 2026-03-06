"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { Story } from "@/lib/types";

export function StoryCard({ story, briefingId }: { story: Story; briefingId?: string }) {
  const handleClick = async () => {
    if (briefingId) {
      try {
        await fetch("/api/clicks/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            briefing_id: briefingId,
            story_url: story.source_url,
            story_title: story.headline,
          }),
        });
      } catch {
        // non-critical
      }
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{story.emoji}</span>
          <div className="flex-1">
            <h4 className="font-semibold leading-snug">{story.headline}</h4>
            <p className="text-sm text-muted-foreground mt-1">{story.summary}</p>
            <a
              href={story.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              {story.source_name}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
