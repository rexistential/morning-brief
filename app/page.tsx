"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SAMPLE_STORIES = [
  { emoji: "🧠", topic: "Foundation Models", headline: "Anthropic releases Claude 4.5 with expanded reasoning", summary: "Major improvements in mathematical reasoning, code generation, and multi-step planning tasks." },
  { emoji: "📈", topic: "Markets & Finance", headline: "NVIDIA market cap surpasses $5 trillion milestone", summary: "Driven by insatiable demand for AI training and inference chips." },
  { emoji: "🚀", topic: "VC & Startups", headline: "AI infrastructure startup raises $500M at $4B valuation", summary: "Modal closes massive Series C led by Sequoia for serverless GPU infrastructure." },
  { emoji: "⚖️", topic: "Policy & Regulation", headline: "EU AI Act enforcement begins with first compliance audits", summary: "European regulators launch first formal audits of high-risk AI systems." },
];

export default function LandingPage() {
  const { user, profile, loading, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (profile && !profile.onboarded) {
        router.push("/onboarding");
      } else if (profile) {
        router.push("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    const { error: err } = await signIn(email);
    if (err) {
      setError(err);
    } else {
      setSent(true);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Morning Brief</h1>
          <Badge variant="secondary">Beta</Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        <section className="py-20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Your AI briefing, your way
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Get a personalized AI-generated news briefing every morning. Pick your topics, choose your style, and start your day informed.
          </p>

          {sent ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <p className="text-lg font-medium mb-2">Check your email</p>
                <p className="text-muted-foreground">
                  We sent a magic link to <strong>{email}</strong>. Click it to sign in.
                </p>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSignIn} className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Get Started"}
              </Button>
            </form>
          )}
          {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
        </section>

        <section className="pb-20">
          <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
            Sample Briefing Preview
          </h3>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-4">
                Thursday, March 6, 2026
              </div>
              <div className="space-y-6">
                {SAMPLE_STORIES.map((story, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{story.emoji}</span>
                      <div>
                        <Badge variant="outline" className="mb-1 text-xs">{story.topic}</Badge>
                        <h4 className="font-semibold">{story.headline}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{story.summary}</p>
                      </div>
                    </div>
                    {i < SAMPLE_STORIES.length - 1 && <hr className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Morning Brief &mdash; Personalized AI News
      </footer>
    </div>
  );
}
