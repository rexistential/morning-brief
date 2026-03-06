"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { BriefingView } from "@/components/briefing/briefing-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import type { Briefing } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchToday = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/briefing/today");
      if (res.ok) {
        const data = await res.json();
        setBriefing(data.briefing);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const generateBriefing = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/briefing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        await fetchToday();
      }
    } catch {
      // ignore
    }
    setGenerating(false);
  };

  useEffect(() => {
    fetchToday();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!briefing) {
    return (
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-4xl">☀️</div>
          <h3 className="text-lg font-semibold">No briefing yet today</h3>
          <p className="text-muted-foreground">
            Your briefing hasn&apos;t been generated yet. Generate one now or check back later.
          </p>
          <Button onClick={generateBriefing} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate my briefing
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <BriefingView briefing={briefing} />;
}
