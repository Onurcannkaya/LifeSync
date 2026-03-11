-- LifeSync Supabase Database Schema
-- https://supabase.com - Proje oluşturup SQL Editor'de çalıştır

-- Users Tablosu
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friendships Tablosu (YENİ EKLENDİ)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending' (bekliyor) veya 'accepted' (kabul edildi)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Tablosu
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#06b6d4',
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  team UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Tablosu
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  board_id UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  repeat TEXT DEFAULT 'none',
  assignees UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  subtasks JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events Tablosu
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  category TEXT DEFAULT 'work',
  repeat TEXT DEFAULT 'none',
  attendees UUID[] DEFAULT '{}',
  color TEXT DEFAULT '#06b6d4',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes Tablosu
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT DEFAULT '#06b6d4',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habits Tablosu
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#06b6d4',
  frequency TEXT DEFAULT 'daily',
  streak INTEGER DEFAULT 0,
  completed_days JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kanban Boards Tablosu
CREATE TABLE IF NOT EXISTS kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  columns TEXT[] DEFAULT ARRAY['todo', 'in-progress', 'in-review', 'done'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members Tablosu
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'member',
  avatar_url TEXT,
  status TEXT DEFAULT 'offline',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archived Items Tablosu
CREATE TABLE IF NOT EXISTS archived_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) Politikaları
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY; -- YENİ EKLENDİ
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_items ENABLE ROW LEVEL SECURITY;

-- Her kullanıcı kendi verilerini görebilsin
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Friendships POLICIES (YENİ EKLENDİ)
DROP POLICY IF EXISTS "Public read friendships" ON friendships;
CREATE POLICY "Public read friendships" ON friendships FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;
CREATE POLICY "Users can insert friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update friendships" ON friendships;
CREATE POLICY "Users can update friendships" ON friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (user_id = auth.uid() OR user_id IN (SELECT id FROM users));

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (user_id = auth.uid() OR user_id IN (SELECT id FROM users));

DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own events" ON events;
CREATE POLICY "Users can view own events" ON events FOR SELECT USING (user_id = auth.uid() OR user_id IN (SELECT id FROM users));

DROP POLICY IF EXISTS "Users can insert own events" ON events;
CREATE POLICY "Users can insert own events" ON events FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own events" ON events;
CREATE POLICY "Users can delete own events" ON events FOR DELETE USING (user_id = auth.uid());

-- Herkes her şeyi görebilsin (demo için)
DROP POLICY IF EXISTS "Public read users" ON users;
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read projects" ON projects;
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read tasks" ON tasks;
CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read events" ON events;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read notes" ON notes;
CREATE POLICY "Public read notes" ON notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read habits" ON habits;
CREATE POLICY "Public read habits" ON habits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read kanban_boards" ON kanban_boards;
CREATE POLICY "Public read kanban_boards" ON kanban_boards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read team_members" ON team_members;
CREATE POLICY "Public read team_members" ON team_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read archived_items" ON archived_items;
CREATE POLICY "Public read archived_items" ON archived_items FOR SELECT USING (true);

-- Insert sample data
INSERT INTO users (id, email, name, role) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'demo@lifesync.app', 'Demo Kullanıcı', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO kanban_boards (id, user_id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Varsayılan Pano')
ON CONFLICT (id) DO NOTHING;
