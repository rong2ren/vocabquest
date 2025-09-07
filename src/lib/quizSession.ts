import { QuizQuestion } from '@/types'

export interface QuizSessionData {
  sessionId: string
  userId: string
  questions: QuizQuestion[]
  currentQuestionIndex: number
  sessionStats: {
    correct: number
    total: number
    startTime: number
  }
  createdAt: number
  lastUpdated: number
}

const QUIZ_SESSION_KEY = 'quiz-session'

export const QuizSessionManager = {
  // Save quiz session to localStorage
  saveSession: (sessionData: QuizSessionData): void => {
    try {
      const dataToSave = {
        ...sessionData,
        lastUpdated: Date.now()
      }
      localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Failed to save quiz session:', error)
    }
  },

  // Load quiz session from localStorage
  loadSession: (): QuizSessionData | null => {
    try {
      const saved = localStorage.getItem(QUIZ_SESSION_KEY)
      if (!saved) return null

      const sessionData: QuizSessionData = JSON.parse(saved)
      
      // Check if session is expired (older than 24 hours)
      const isExpired = Date.now() - sessionData.createdAt > 24 * 60 * 60 * 1000
      if (isExpired) {
        QuizSessionManager.clearSession()
        return null
      }

      return sessionData
    } catch (error) {
      console.error('Failed to load quiz session:', error)
      QuizSessionManager.clearSession()
      return null
    }
  },

  // Clear quiz session from localStorage
  clearSession: (): void => {
    try {
      localStorage.removeItem(QUIZ_SESSION_KEY)
    } catch (error) {
      console.error('Failed to clear quiz session:', error)
    }
  },

  // Check if there's an active session
  hasActiveSession: (): boolean => {
    return QuizSessionManager.loadSession() !== null
  },

  // Create a new session ID
  createSessionId: (): string => {
    return `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
