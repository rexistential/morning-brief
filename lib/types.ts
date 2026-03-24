export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  topics: string[];
  briefing_length: "quick" | "standard" | "deep";
  briefing_tone: "punchy" | "neutral" | "technical" | "dense" | "trends";
  send_time: string;
  timezone: string;
  email_enabled: boolean;
  onboarded: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Story {
  emoji: string;
  headline: string;
  summary: string;
  source_url: string;
  source_name: string;
  topic: string;
  portfolio_company_id?: string;
  is_competitor_news?: boolean;
  affected_portfolio_company?: string;
}

export interface TopicSection {
  topic: string;
  label: string;
  body?: string;
  stories: Story[];
}

export interface Briefing {
  id: string;
  user_id: string;
  content: string;
  content_html: string | null;
  stories: Story[];
  topic_sections: TopicSection[];
  generated_at: string;
  sent_at: string | null;
  sent_via: "email" | "web" | null;
  briefing_date: string;
  created_at: string;
}

export interface DailyNewsPoolItem {
  id: string;
  fetch_date: string;
  topic: string;
  headline: string;
  summary: string;
  source_url: string;
  source_name: string;
  emoji: string;
  fetched_at: string;
  portfolio_company_id?: string;
  is_competitor_news?: boolean;
  affected_portfolio_company?: string;
}

export interface StoryClick {
  id: string;
  user_id: string;
  briefing_id: string;
  story_url: string;
  story_title: string | null;
  clicked_at: string;
}
