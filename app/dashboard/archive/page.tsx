"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BriefingView } from "@/components/briefing/briefing-view";
import { Loader2, ArrowLeft } from "lucide-react";
import type { Briefing } from "@/lib/types";

export default function ArchivePage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Briefing | null>(null);

  useEffect(() => {
    const fetchBriefings = async () => {
      try {
        const res = await fetch("/api/briefings");
        if (res.ok) {
          const data = await res.json();
          setBriefings(data.briefings || []);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    };
    fetchBriefings();
  }, []);

  if (selected) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to archive
        </Button>
        <BriefingView briefing={selected} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Archive</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : briefings.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No past briefings yet. Your briefings will appear here once generated.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {briefings.map(b => {
            const date = new Date(b.briefing_date);
            const formatted = date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium">{formatted}</div>
                <div className="text-sm text-muted-foreground">
                  {b.stories?.length || 0} stories &middot; {b.topic_sections?.length || 0} topics
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
