'use client'
import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

  const signInWithEmail = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email: string, password: string, name: string) =>
    supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

  const signOut = () => supabase.auth.signOut()

  const saveFavorite = async (establishmentId: string) => {
    if (!user) return
    await supabase.from('favorites').upsert({ user_id: user.id, establishment_id: establishmentId })
  }

  const removeFavorite = async (establishmentId: string) => {
    if (!user) return
    await supabase.from('favorites').delete().match({ user_id: user.id, establishment_id: establishmentId })
  }

  const getFavorites = async (): Promise<string[]> => {
    if (!user) return []
    const { data } = await supabase.from('favorites').select('establishment_id').eq('user_id', user.id)
    return data?.map(r => r.establishment_id) ?? []
  }

  return { user, session, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, saveFavorite, removeFavorite, getFavorites }
}
