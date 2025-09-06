import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Get the hash fragment from the URL
        const hashFragment = window.location.hash
        
        if (hashFragment && hashFragment.length > 0) {
          // Exchange the auth code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment)
          
          if (error) {
            console.error('Error exchanging code for session:', error)
            toast.error(error.message)
            navigate('/auth?error=' + encodeURIComponent(error.message))
            return
          }
          
          if (data.session) {
            // Successfully signed in
            toast.success('Welcome to VocabQuest!')
            navigate('/dashboard')
            return
          }
        }
        
        // Check for error in search params
        const error = searchParams.get('error')
        if (error) {
          toast.error(error)
          navigate('/auth?error=' + encodeURIComponent(error))
          return
        }
        
        // If we get here, something went wrong
        navigate('/auth?error=No session found')
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/auth?error=Authentication failed')
      }
    }
    
    handleAuthCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}