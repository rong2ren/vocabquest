import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User, UserGamification } from '@/types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: SupabaseUser | null
  profile: User | null
  gamification: UserGamification | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  refreshProfile: () => Promise<void>
  initializeUser: (profileData: Partial<User>) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [gamification, setGamification] = useState<UserGamification | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Request deduplication: track ongoing profile requests by userId
  const ongoingRequests = useRef<Map<string, Promise<any>>>(new Map())
  
  // Profile data cache: store profile data in memory to avoid redundant API calls
  const profileCache = useRef<Map<string, { profile: User; gamification: UserGamification; timestamp: number }>>(new Map())

  // Load user on mount
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    async function loadUser() {
      try {
        // Set a safety timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn('Auth loading timeout - forcing loading to false')
          setLoading(false)
        }, 5000) // 5 seconds timeout
        
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
        
        // Use direct fetch instead of supabase.functions.invoke (which hangs)
        // Use the anon key for now - the function will extract user ID from the request context
        const response = await fetch('https://zxxkutexabspjiwghsvn.supabase.co/functions/v1/user-profile', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGt1dGV4YWJzcGppd2doc3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTYwNzMsImV4cCI6MjA2ODM3MjA3M30.us8-BQW50RsdhMfMtTPnTshexKBBv7qisCB6sSQEMQk',
            'Content-Type': 'application/json',
            'X-User-ID': userId // Pass the user ID directly
          }
        })

        const data = await response.json()
        const error = response.ok ? null : new Error(`HTTP ${response.status}`)

        if (error) {
          console.error('Error loading user profile:', error)
          // Don't throw error, just log it - user can still use the app
          return
        }

        if (data?.data) {
          const profileData = {
            profile: data.data.profile,
            gamification: data.data.gamification,
            timestamp: now
          }
          
          // Cache the data
          profileCache.current.set(userId, profileData)
          
          // Set the state
          setProfile(profileData.profile)
          setGamification(profileData.gamification)
          
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
    toast.success('Signed out successfully')
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    try {
      // Update profile directly in the database
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Database error updating profile:', error)
        toast.error('Failed to update profile')
        throw error
      }

      if (data) {
        // Update local state
        setProfile(data)
        // Clear cache to force refresh on next load
        profileCache.current.delete(user.id)
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

  const initializeUser = async (profileData: Partial<User>) => {
    try {
      // Use direct fetch instead of supabase.functions.invoke (which hangs)
      // Use the anon key and pass user ID in header
      const response = await fetch('https://zxxkutexabspjiwghsvn.supabase.co/functions/v1/user-initialize', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGt1dGV4YWJzcGppd2doc3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTYwNzMsImV4cCI6MjA2ODM3MjA3M30.us8-BQW50RsdhMfMtTPnTshexKBBv7qisCB6sSQEMQk',
          'Content-Type': 'application/json',
          'X-User-ID': user?.id || '' // Pass the user ID directly
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error initializing user:', data)
        throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`)
      }

      if (data?.data?.is_new_user) {
        // Clear cache to force reload of profile data
        profileCache.current.delete(user?.id || '')
        await loadUserProfile(user?.id || '')
        toast.success('Welcome! Your account has been set up.')
      }

      return data
    } catch (error) {
      console.error('Error initializing user:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    gamification,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    initializeUser
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