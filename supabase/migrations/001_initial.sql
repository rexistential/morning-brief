-- Morning Brief schema

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  briefing_length TEXT NOT NULL DEFAULT 'standard' CHECK (briefing_length IN ('quick', 'standard', 'deep')),
  briefing_tone TEXT NOT NULL DEFAULT 'punchy' CHECK (briefing_tone IN ('punchy', 'neutral', 'technical')),
  send_time TEXT NOT NULL DEFAULT '07:00',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Briefings table
CREATE TABLE IF NOT EXISTS briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  stories JSONB NOT NULL DEFAULT '[]',
  topic_sections JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  sent_via TEXT CHECK (sent_via IN ('email', 'web')),
  briefing_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story clicks table
CREATE TABLE IF NOT EXISTS story_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  briefing_id UUID REFERENCES briefings(id) ON DELETE CASCADE NOT NULL,
  story_url TEXT NOT NULL,
  story_title TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_briefings_user_date ON briefings(user_id, briefing_date);
CREATE INDEX IF NOT EXISTS idx_briefings_date ON briefings(briefing_date);
CREATE INDEX IF NOT EXISTS idx_story_clicks_user ON story_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_story_clicks_briefing ON story_clicks(briefing_id);

-- Unique constraint for one briefing per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_briefings_user_date_unique ON briefings(user_id, briefing_date);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_clicks ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin override: admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Briefings: users can read their own briefings
CREATE POLICY "Users can read own briefings" ON briefings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefings" ON briefings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin override: admins can read all briefings
CREATE POLICY "Admins can read all briefings" ON briefings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Story clicks: users can read/insert their own clicks
CREATE POLICY "Users can read own clicks" ON story_clicks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clicks" ON story_clicks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
