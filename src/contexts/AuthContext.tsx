import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User, UserGamification, DailyGoal } from '@/types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: SupabaseUser | null
  profile: User | null
  gamification: UserGamification | null
  dailyGoal: DailyGoal | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [gamification, setGamification] = useState<UserGamification | null>(null)
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    async function loadUser() {
      try {
        // Set a safety timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn('Auth loading timeout - forcing loading to false')
          setLoading(false)
        }, 10000) // 10 seconds timeout
        
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          await loadUserProfile(user.id)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }
    
    loadUser()

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null
        setUser(currentUser)
        
        if (currentUser) {
          setLoading(true)
          try {
            await loadUserProfile(currentUser.id)
          } finally {
            setLoading(false)
          }
        } else {
          setProfile(null)
          setGamification(null)
          setDailyGoal(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('user-profile', {
        method: 'GET'
      })

      if (error) {
        console.error('Error loading user profile:', error)
        // Don't throw error, just log it - user can still use the app
        return
      }

      if (data?.data) {
        setProfile(data.data.profile)
        setGamification(data.data.gamification)
        setDailyGoal(data.data.daily_goal)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Don't throw error, just log it - user can still use the app
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      toast.error(error.message)
      throw error
    }

    toast.success('Welcome back!')
    return data
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
      }
    })

    if (error) {
      toast.error(error.message)
      throw error
    }

    toast.success('Check your email to confirm your account!')
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      throw error
    }
    
    setUser(null)
    setProfile(null)
    setGamification(null)
    setDailyGoal(null)
    toast.success('Signed out successfully')
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const { data, error } = await supabase.functions.invoke('user-profile', {
        method: 'POST',
        body: updates
      })

      if (error) {
        toast.error('Failed to update profile')
        throw error
      }

      if (data?.data) {
        setProfile(data.data.profile)
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    gamification,
    dailyGoal,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}