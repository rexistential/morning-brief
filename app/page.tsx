"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

const SAMPLE_STORIES = [
  { emoji: "🧠", topic: "Foundation Models", headline: "Anthropic releases Claude 4.5 with expanded reasoning", summary: "Major improvements in mathematical reasoning, code generation, and multi-step planning tasks." },
  { emoji: "📈", topic: "Markets & Finance", headline: "NVIDIA market cap surpasses $5 trillion milestone", summary: "Driven by insatiable demand for AI training and inference chips." },
  { emoji: "🚀", topic: "VC & Startups", headline: "AI infrastructure startup raises $500M at $4B valuation", summary: "Modal closes massive Series C led by Sequoia for serverless GPU infrastructure." },
  { emoji: "⚖️", topic: "Policy & Regulation", headline: "EU AI Act enforcement begins with first compliance audits", summary: "European regulators launch first formal audits of high-risk AI systems." },
];

export default function LandingPage() {
  const { user, profile, loading, signUp, signIn, signInWithMagicLink } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!loading && user) {
      if (profile && !profile.onboarded) {
        router.push("/onboarding");
      } else if (profile) {
        router.push("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    if (mode === "forgot") {
      const { error: err } = await signInWithMagicLink(email);
      if (err) {
        setError(err);
      } else {
        setSuccessMessage("Password reset link sent — check your email.");
      }
      setSubmitting(false);
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        setSubmitting(false);
        return;
      }
      const { error: err } = await signUp(email, password);
      if (err) {
        setError(err);
      }
      // signUp with auto-confirm will log them in automatically
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
      }
    }
    setSubmitting(false);
  };

  const switchMode = (newMode: "signin" | "signup" | "forgot") => {
    setMode(newMode);
    setError("");
    setSuccessMessage("");
    setPassword("");
    setConfirmPassword("");
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

          <Card className="max-w-sm mx-auto text-left">
            <CardHeader className="text-center">
              <CardTitle>
                {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
              </CardTitle>
              <CardDescription>
                {mode === "signin"
                  ? "Welcome back — sign in to your briefing."
                  : mode === "signup"
                    ? "Set up your personalized AI briefing in under a minute."
                    : "Enter your email and we'll send you a reset link."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                {mode !== "forgot" && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === "signup" && (
                  <div>
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                    </div>
                  </div>
                )}

                {error && <p className="text-destructive text-sm">{error}</p>}
                {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting
                    ? "Hold on..."
                    : mode === "signin"
                      ? "Sign in"
                      : mode === "signup"
                        ? "Create account"
                        : "Send reset link"}
                </Button>
              </form>

              <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
                {mode === "signin" && (
                  <>
                    <div>
                      <button
                        className="text-primary underline-offset-4 hover:underline"
                        onClick={() => switchMode("forgot")}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div>
                      Don&apos;t have an account?{" "}
                      <button
                        className="text-primary underline-offset-4 hover:underline"
                        onClick={() => switchMode("signup")}
                      >
                        Sign up
                      </button>
                    </div>
                  </>
                )}
                {mode === "signup" && (
                  <div>
                    Already have an account?{" "}
                    <button
                      className="text-primary underline-offset-4 hover:underline"
                      onClick={() => switchMode("signin")}
                    >
                      Sign in
                    </button>
                  </div>
                )}
                {mode === "forgot" && (
                  <div>
                    Remember your password?{" "}
                    <button
                      className="text-primary underline-offset-4 hover:underline"
                      onClick={() => switchMode("signin")}
                    >
                      Sign in
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
