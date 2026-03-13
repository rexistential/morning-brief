"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TOPICS, BRIEFING_LENGTHS, BRIEFING_TONES, SEND_TIMES, TIMEZONES } from "@/lib/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [topics, setTopics] = useState<string[]>([]);
  const [briefingLength, setBriefingLength] = useState("standard");
  const [briefingTone, setBriefingTone] = useState("punchy");
  const [sendTime, setSendTime] = useState("07:00");
  const [timezone, setTimezone] = useState("US/Eastern");
  const [emailAddress, setEmailAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
    if (user) {
      setEmailAddress(user.email || "");
    }
    if (profile?.onboarded) {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (TIMEZONES.includes(tz as typeof TIMEZONES[number])) {
        setTimezone(tz);
      }
    } catch {
      // keep default
    }
  }, []);

  const toggleTopic = (id: string) => {
    setTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailAddress,
        topics,
        briefing_length: briefingLength,
        briefing_tone: briefingTone,
        send_time: sendTime,
        timezone,
        onboarded: true,
      }),
    });
    
    if (!res.ok) {
      const data = await res.json();
      console.error("Failed to save preferences:", data.error);
      setSaving(false);
      return;
    }
    await refreshProfile();
    router.push("/dashboard");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Set up your Morning Brief</h1>
          <p className="text-muted-foreground">Step {step} of 3</p>
          <Progress value={(step / 3) * 100} className="mt-4" />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Pick your beats</CardTitle>
              <CardDescription>Choose the topics you want covered in your daily briefing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPICS.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    aria-pressed={topics.includes(topic.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                      topics.includes(topic.id)
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg">{topic.emoji}</span>
                    <span>{topic.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={topics.length === 0}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Briefing style</CardTitle>
              <CardDescription>How do you like your news?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block font-medium">Length</Label>
                <div className="grid grid-cols-3 gap-3">
                  {BRIEFING_LENGTHS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setBriefingLength(opt.id)}
                      aria-pressed={briefingLength === opt.id}
                      className={`p-3 rounded-lg border text-center text-sm transition-colors ${
                        briefingLength === opt.id
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-3 block font-medium">Tone</Label>
                <div className="grid grid-cols-3 gap-3">
                  {BRIEFING_TONES.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setBriefingTone(opt.id)}
                      aria-pressed={briefingTone === opt.id}
                      className={`p-3 rounded-lg border text-center text-sm transition-colors ${
                        briefingTone === opt.id
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery preferences</CardTitle>
              <CardDescription>When and where should we send your briefing?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="send-time" className="mb-2 block">Send time</Label>
                <Select value={sendTime} onValueChange={setSendTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEND_TIMES.map(t => (
                      <SelectItem key={t} value={t}>{t} AM</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timezone" className="mb-2 block">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email" className="mb-2 block">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">Selected topics</Badge>
                {topics.map(t => {
                  const topic = TOPICS.find(x => x.id === t);
                  return topic ? <span key={t}>{topic.emoji}</span> : null;
                })}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Start my briefings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
