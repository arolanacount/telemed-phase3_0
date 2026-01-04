import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export function useSessionTimeout(timeoutMinutes: number = 5) {
  const router = useRouter()
  const timeoutRef = useRef<any>(undefined)
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimer = () => {
    lastActivityRef.current = Date.now()

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      console.log('Session timeout: Signing out due to inactivity')

      const supabase = createClient()
      await supabase.auth.signOut()

      // Redirect to sign in page
      router.push('/signin')
    }, timeoutMinutes * 60 * 1000) // Convert minutes to milliseconds
  }

  const handleActivity = () => {
    // Only reset timer if enough time has passed (prevent excessive resets)
    const now = Date.now()
    if (now - lastActivityRef.current > 1000) { // Only reset if more than 1 second has passed
      resetTimer()
    }
  }

  useEffect(() => {
    // Only set up session timeout if we're in a browser environment and likely authenticated
    // (We can't check auth state directly in this hook, so we assume it's called from authenticated contexts)
    if (typeof window === 'undefined') {
      return
    }

    // Set up event listeners for user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Start the initial timer
    resetTimer()

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [timeoutMinutes, router])

  // Function to manually reset the timer (useful for specific actions)
  const resetSessionTimer = () => {
    resetTimer()
  }

  return { resetSessionTimer }
}
