"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { Story } from "@/lib/types";

export function StoryCard({ story, briefingId }: { story: Story; briefingId?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

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

  const toggleExpand = async () => {
    if (!expanded && !articleContent && !fetchError) {
      setLoading(true);
      try {
        const res = await fetch("/api/article/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: story.source_url }),
        });
        if (res.ok) {
          const data = await res.json();
          setArticleContent(data.content);
        } else {
          setFetchError(true);
        }
      } catch {
        setFetchError(true);
      }
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{story.emoji}</span>
          <div className="flex-1">
            <h4 className="font-semibold leading-snug">{story.headline}</h4>
            <p className="text-sm text-muted-foreground mt-1">{story.summary}</p>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={toggleExpand}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Read more
                  </>
                )}
              </button>

              <a
                href={story.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                {story.source_name}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {expanded && (
              <div className="mt-3 pl-0 border-l-2 border-muted pl-4">
                {fetchError ? (
                  <p className="text-sm text-muted-foreground italic">
                    Couldn&apos;t load the full article.{" "}
                    <a
                      href={story.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Read it on {story.source_name} →
                    </a>
                  </p>
                ) : articleContent ? (
                  <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto">
                    {articleContent}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
