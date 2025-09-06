import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  
  // Request deduplication: track ongoing profile requests by userId
  const ongoingRequests = useRef<Map<string, Promise<any>>>(new Map())
  
  // Profile data cache: store profile data in memory to avoid redundant API calls
  const profileCache = useRef<Map<string, { profile: User; gamification: UserGamification; dailyGoal: DailyGoal; timestamp: number }>>(new Map())

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
    // Check cache first - if data exists and is less than 5 minutes old, use it
    const cached = profileCache.current.get(userId)
    const now = Date.now()
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached profile data for user:', userId)
      setProfile(cached.profile)
      setGamification(cached.gamification)
      setDailyGoal(cached.dailyGoal)
      return
    }

    // Check if there's already an ongoing request for this user
    const existingRequest = ongoingRequests.current.get(userId)
    if (existingRequest) {
      console.log('Profile request already in progress for user:', userId)
      return existingRequest
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        console.log('Loading user profile for:', userId)
        
        // Add 3 second timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile timeout')), 3000)
        )
        
        const profilePromise = supabase.functions.invoke('user-profile', {
          method: 'GET'
        })
        
        const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

        if (error) {
          console.error('Error loading user profile:', error)
          // Don't throw error, just log it - user can still use the app
          return
        }

        if (data?.data) {
          const profileData = {
            profile: data.data.profile,
            gamification: data.data.gamification,
            dailyGoal: data.data.daily_goal,
            timestamp: now
          }
          
          // Cache the data
          profileCache.current.set(userId, profileData)
          
          // Set the state
          setProfile(profileData.profile)
          setGamification(profileData.gamification)
          setDailyGoal(profileData.dailyGoal)
          
          console.log('Profile loaded and cached for user:', userId)
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        // Don't throw error, just log it - user can still use the app
      } finally {
        // Remove the request from ongoing requests
        ongoingRequests.current.delete(userId)
      }
    })()

    // Store the request promise
    ongoingRequests.current.set(userId, requestPromise)
    
    return requestPromise
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
    
    // Clear ongoing requests, cache, and reset state
    ongoingRequests.current.clear()
    profileCache.current.clear()
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
      // Clear cache and ongoing request for this user to force a fresh request
      profileCache.current.delete(user.id)
      ongoingRequests.current.delete(user.id)
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