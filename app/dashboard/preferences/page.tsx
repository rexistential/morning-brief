"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { TOPICS, BRIEFING_LENGTHS, BRIEFING_TONES, SEND_TIMES, TIMEZONES } from "@/lib/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save } from "lucide-react";

export default function PreferencesPage() {
  const { profile, refreshProfile } = useAuth();
  const [topics, setTopics] = useState<string[]>([]);
  const [briefingLength, setBriefingLength] = useState("standard");
  const [briefingTone, setBriefingTone] = useState("punchy");
  const [sendTime, setSendTime] = useState("07:00");
  const [timezone, setTimezone] = useState("US/Eastern");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setTopics(profile.topics || []);
      setBriefingLength(profile.briefing_length);
      setBriefingTone(profile.briefing_tone);
      setSendTime(profile.send_time);
      setTimezone(profile.timezone);
      setEmailAddress(profile.email);
      setEmailEnabled(profile.email_enabled);
    }
  }, [profile]);

  const toggleTopic = (id: string) => {
    setTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.from("profiles").update({
      email: emailAddress,
      topics,
      briefing_length: briefingLength,
      briefing_tone: briefingTone,
      send_time: sendTime,
      timezone,
      email_enabled: emailEnabled,
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.from("profiles").delete().eq("id", profile!.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Preferences</h2>

      <Card>
        <CardHeader>
          <CardTitle>Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {TOPICS.map(topic => (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Briefing Style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">Length</Label>
            <div className="grid grid-cols-3 gap-3">
              {BRIEFING_LENGTHS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setBriefingLength(opt.id)}
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
            <Label className="mb-3 block">Tone</Label>
            <div className="grid grid-cols-3 gap-3">
              {BRIEFING_TONES.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setBriefingTone(opt.id)}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Email delivery</Label>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
          <div>
            <Label className="mb-2 block">Send time</Label>
            <Select value={sendTime} onValueChange={setSendTime}>
              <SelectTrigger className="w-48">
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
            <Label className="mb-2 block">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-48">
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
            <Label className="mb-2 block">Email address</Label>
            <Input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saved ? "Saved!" : "Save preferences"}
        </Button>
      </div>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data.
          </p>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Delete my account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
