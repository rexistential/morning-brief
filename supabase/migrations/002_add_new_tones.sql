ALTER TABLE profiles DROP CONSTRAINT profiles_briefing_tone_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_briefing_tone_check CHECK (briefing_tone IN ('punchy', 'neutral', 'technical', 'dense', 'trends'));
