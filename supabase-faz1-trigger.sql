-- LifeSync FAZ 1: Auth Trigger + RLS Güncellemesi
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- ═══════════════════════════════════════════
--  1) AUTH TRIGGER: Yeni kayıt olan kullanıcıyı
--     otomatik olarak public.users tablosuna ekler
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════
--  2) RLS POLİTİKALARI: Tam CRUD izinleri
-- ═══════════════════════════════════════════

-- TASKS
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (user_id = auth.uid());

-- EVENTS
DROP POLICY IF EXISTS "Users can insert own events" ON events;
CREATE POLICY "Users can insert own events" ON events FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own events" ON events;
CREATE POLICY "Users can view own events" ON events FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own events" ON events;
CREATE POLICY "Users can delete own events" ON events FOR DELETE USING (user_id = auth.uid());

-- PROJECTS
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (user_id = auth.uid());

-- USERS — Herkes arayabilsin, sadece kendini güncelleyebilsin
DROP POLICY IF EXISTS "Public read users" ON users;
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- FRIENDSHIPS — Mevcut politikalar korunuyor
DROP POLICY IF EXISTS "Public read friendships" ON friendships;
CREATE POLICY "Public read friendships" ON friendships FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;
CREATE POLICY "Users can insert friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update friendships" ON friendships;
CREATE POLICY "Users can update friendships" ON friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
