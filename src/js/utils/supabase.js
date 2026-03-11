/**
 * LifeSync - Supabase Client & API
 * Auth + CRUD for tasks, events, projects, friendships
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing! Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ═══════════════════════════════════════════
//  AUTH FUNCTIONS
// ═══════════════════════════════════════════

/**
 * Sign up a new user with email + password.
 * Also stores `name` in user_metadata so the DB trigger can read it.
 */
export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }   // stored in raw_user_meta_data
    }
  });
  if (error) throw error;
  return data;
}

/**
 * Sign in with email + password.
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current session (null if not logged in).
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Listen for auth state changes (login, logout, token refresh).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => callback(event, session)
  );
  return subscription;
}

// ═══════════════════════════════════════════
//  TASKS CRUD
// ═══════════════════════════════════════════

export async function fetchTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchTasks:', error); return []; }
  return data || [];
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ═══════════════════════════════════════════
//  EVENTS CRUD
// ═══════════════════════════════════════════

export async function fetchEvents(userId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true });
  if (error) { console.error('fetchEvents:', error); return []; }
  return data || [];
}

export async function createEvent(event) {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ═══════════════════════════════════════════
//  PROJECTS CRUD
// ═══════════════════════════════════════════

export async function fetchProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchProjects:', error); return []; }
  return data || [];
}

export async function createProject(project) {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ═══════════════════════════════════════════
//  SOCIAL — SEARCH & FRIENDS
// ═══════════════════════════════════════════

export async function searchProfiles(query) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('searchProfiles error:', err);
    return [];
  }
}

export async function addFriend(userId, friendId) {
  try {
    const { error } = await supabase
      .from('friendships')
      .insert([{ user_id: userId, friend_id: friendId, status: 'pending' }]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('addFriend error:', err);
    return false;
  }
}

/**
 * Fetch pending friend requests sent TO this user.
 * Joins with users table to get sender profile info.
 */
export async function fetchPendingRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id, created_at, users!friendships_user_id_fkey(id, name, email, avatar_url)')
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchPendingRequests error:', error);
      // Fallback: fetch without join
      const { data: fallback } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', userId)
        .eq('status', 'pending');
      return (fallback || []).map(f => ({
        ...f,
        sender: { id: f.user_id, name: 'Kullanıcı', email: '', avatar_url: '' }
      }));
    }

    return (data || []).map(row => ({
      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,
      sender: row.users || { id: row.user_id, name: 'Kullanıcı', email: '', avatar_url: '' }
    }));
  } catch (err) {
    console.error('fetchPendingRequests error:', err);
    return [];
  }
}

/**
 * Fetch accepted friends for a user (from both directions).
 */
export async function fetchFriends(userId) {
  try {
    // Friends where I sent the request
    const { data: sent } = await supabase
      .from('friendships')
      .select('friend_id, users!friendships_friend_id_fkey(id, name, email, avatar_url)')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    // Friends where they sent the request to me
    const { data: received } = await supabase
      .from('friendships')
      .select('user_id, users!friendships_user_id_fkey(id, name, email, avatar_url)')
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    const friends = [];

    (sent || []).forEach(row => {
      if (row.users) friends.push(row.users);
    });
    (received || []).forEach(row => {
      if (row.users) friends.push(row.users);
    });

    // Deduplicate by id
    const uniqueFriends = [...new Map(friends.map(f => [f.id, f])).values()];
    return uniqueFriends;
  } catch (err) {
    console.error('fetchFriends error:', err);
    return [];
  }
}

/**
 * Accept a pending friendship request.
 */
export async function acceptFriend(requestId) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);
  if (error) throw error;
}

/**
 * Reject (delete) a friendship request.
 */
export async function rejectFriend(requestId) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);
  if (error) throw error;
}
