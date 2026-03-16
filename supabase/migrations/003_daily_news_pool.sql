CREATE TABLE daily_news_pool (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fetch_date DATE NOT NULL,
  topic TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  emoji TEXT DEFAULT '',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fetch_date, source_url)
);

CREATE INDEX idx_daily_news_pool_date_topic ON daily_news_pool(fetch_date, topic);

-- RLS: only service role can read/write (no user access needed)
ALTER TABLE daily_news_pool ENABLE ROW LEVEL SECURITY;
