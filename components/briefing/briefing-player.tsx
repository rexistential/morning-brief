"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import type { Briefing } from "@/lib/types";

// Preferred voices in priority order — natural-sounding English voices
const PREFERRED_VOICES = [
  "Google UK English Male",
  "Google UK English Female",
  "Daniel",           // macOS / iOS
  "Samantha",         // macOS / iOS
  "Microsoft George", // Windows
  "Microsoft Ryan",   // Windows
  "Rishi",            // macOS
  "Google US English",
];

const SPEEDS: number[] = [1, 1.25, 1.5, 2];

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")          // headers
    .replace(/\*\*(.*?)\*\*/g, "$1")     // bold
    .replace(/\*(.*?)\*/g, "$1")         // italic
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")  // links
    .replace(/[↗️]/g, "")               // arrows/emoji artifacts
    .replace(/```[\s\S]*?```/g, "")      // code blocks
    .replace(/`(.*?)`/g, "$1")           // inline code
    .replace(/\n{3,}/g, "\n\n")          // excessive newlines
    .trim();
}

function extractReadableText(briefing: Briefing): string {
  const parts: string[] = [];

  // Opener
  const opener = briefing.content?.split("\n\n##")[0]?.trim();
  if (opener && !opener.startsWith("##")) {
    parts.push(opener);
  }

  // Sections
  for (const section of briefing.topic_sections) {
    parts.push(`${section.label}.`);

    if (section.body) {
      parts.push(stripMarkdown(section.body));
    } else {
      for (const story of section.stories) {
        parts.push(`${story.headline}. ${story.summary}`);
      }
    }
  }

  return stripMarkdown(parts.join("\n\n"));
}

// Split text into sentence-sized chunks to avoid browser cutoff
function chunkText(text: string, maxLen = 200): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Try preferred voices first
  for (const name of PREFERRED_VOICES) {
    const match = voices.find(
      (v) => v.name === name || v.name.includes(name)
    );
    if (match) return match;
  }
  // Fallback: first English voice
  const english = voices.find(
    (v) => v.lang.startsWith("en-") || v.lang === "en"
  );
  return english || voices[0] || null;
}

export function BriefingPlayer({ briefing }: { briefing: Briefing }) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(true);

  const chunksRef = useRef<string[]>([]);
  const currentChunkRef = useRef(0);
  const totalChunksRef = useRef(0);
  const speedRef = useRef(SPEEDS[0]);

  // Check support and load voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakChunk = useCallback(
    (index: number) => {
      if (index >= chunksRef.current.length) {
        // Done
        setPlaying(false);
        setPaused(false);
        setProgress(100);
        return;
      }

      currentChunkRef.current = index;
      const utterance = new SpeechSynthesisUtterance(chunksRef.current[index]);
      const voice = pickVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.rate = speedRef.current;
      utterance.pitch = 1;

      utterance.onend = () => {
        const next = currentChunkRef.current + 1;
        const pct = Math.round((next / totalChunksRef.current) * 100);
        setProgress(pct);
        speakChunk(next);
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled") {
          // Skip broken chunk, continue
          speakChunk(currentChunkRef.current + 1);
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [voices]
  );

  const handlePlay = useCallback(() => {
    if (!window.speechSynthesis) return;

    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }

    // Fresh start
    window.speechSynthesis.cancel();
    const text = extractReadableText(briefing);
    const chunks = chunkText(text);
    chunksRef.current = chunks;
    totalChunksRef.current = chunks.length;
    currentChunkRef.current = 0;
    setProgress(0);
    setPlaying(true);
    setPaused(false);
    speakChunk(0);
  }, [briefing, paused, speakChunk]);

  const handlePause = useCallback(() => {
    window.speechSynthesis?.pause();
    setPaused(true);
    setPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
    currentChunkRef.current = 0;
  }, []);

  const handleRestart = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
    currentChunkRef.current = 0;
    // Small delay then play
    setTimeout(() => handlePlay(), 50);
  }, [handlePlay]);

  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    speedRef.current = SPEEDS[next];

    // If currently playing, restart current chunk at new speed
    if (playing) {
      window.speechSynthesis?.cancel();
      speakChunk(currentChunkRef.current);
    }
  }, [speedIdx, playing, speakChunk]);

  if (!supported) return null;

  const isActive = playing || paused;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 mb-8">
      {/* Play / Pause */}
      {playing ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handlePause}
          aria-label="Pause"
        >
          <Pause className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handlePlay}
          aria-label={paused ? "Resume" : "Play briefing"}
        >
          <Play className="h-4 w-4" />
        </Button>
      )}

      {/* Progress bar */}
      <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
        <div
          className="h-full bg-foreground/40 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Speed toggle */}
      <button
        onClick={cycleSpeed}
        className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0 w-10 text-center"
        aria-label="Change playback speed"
      >
        {SPEEDS[speedIdx]}×
      </button>

      {/* Stop / Restart */}
      {isActive && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleRestart}
            aria-label="Restart"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleStop}
            aria-label="Stop"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      {/* Label when idle */}
      {!isActive && (
        <span className="text-xs text-muted-foreground shrink-0">
          Listen to briefing
        </span>
      )}
    </div>
  );
}
