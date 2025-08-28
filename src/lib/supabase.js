import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Database helper functions
export const saveContent = async (contentData) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('saved_items')
    .insert({
      user_id: user.id,
      ...contentData,
    })
    .select()
    .single()

  return { data, error }
}

export const getSavedItems = async (userId = null) => {
  let userIdToUse = userId
  
  if (!userIdToUse) {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')
    userIdToUse = user.id
  }

  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', userIdToUse)
    .order('created_at', { ascending: false })
    .limit(50) // Limit results for better performance

  return { data, error }
}

export const updateSavedItem = async (itemId, updates) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('saved_items')
    .update(updates)
    .eq('id', itemId)
    .eq('user_id', user.id)
    .select()
    .single()

  return { data, error }
}

export const deleteSavedItem = async (itemId) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('saved_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  return { error }
}

// User preferences
export const getUserPreferences = async () => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return { data, error }
}

export const updateUserPreferences = async (preferences) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  return { data, error }
}