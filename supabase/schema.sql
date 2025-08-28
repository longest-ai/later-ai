-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories enum
CREATE TYPE category_type AS ENUM ('기술', '비즈니스', '디자인', '교육', '기타');

-- saved_items table
CREATE TABLE saved_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content fields
  url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  
  -- AI Classification fields
  category category_type DEFAULT '기타',
  tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_processed BOOLEAN DEFAULT false,
  
  -- Meta fields
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- user_preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Preferences
  default_category category_type DEFAULT '기타',
  interests TEXT[] DEFAULT '{}',
  ai_auto_classify BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  
  -- Meta fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for better performance
CREATE INDEX idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX idx_saved_items_category ON saved_items(category);
CREATE INDEX idx_saved_items_created_at ON saved_items(created_at DESC);
CREATE INDEX idx_saved_items_is_starred ON saved_items(is_starred);
CREATE INDEX idx_saved_items_tags ON saved_items USING GIN(tags);

-- RLS (Row Level Security) Policies
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for saved_items
CREATE POLICY "Users can view their own saved items" ON saved_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved items" ON saved_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved items" ON saved_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved items" ON saved_items
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_items_updated_at BEFORE UPDATE ON saved_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user preferences on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();