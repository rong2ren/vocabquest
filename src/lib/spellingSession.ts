import { VocabularyWord } from '@/types'

export type HintLevel = 0 | 1 | 2 | 3 | 4 | 5

export interface SpellingWordAttempt {
  wordId: string
  word: VocabularyWord
  attempts: Array<{
    answer: string
    hintLevel: HintLevel
    isCorrect: boolean
    timestamp: number
  }>
  completed: boolean
  finalAnswer?: string
  finalHintLevel?: HintLevel
  pointsEarned: number
}

export interface SpellingSessionStats {
  wordsAttempted: number
  wordsCorrect: number
  totalHintsUsed: number
  totalTime: number
  pointsEarned: number
}

export interface SpellingSessionData {
  sessionId: string
  userId: string
  currentWordIndex: number
  sessionWords: VocabularyWord[]
  wordAttempts: SpellingWordAttempt[]
  currentAnswer: string
  currentHintLevel: HintLevel
  sessionStats: SpellingSessionStats
  sessionStartTime: number
  wordStartTime: number
  audioEnabled: boolean
  createdAt: number
  lastUpdated: number
}

const SPELLING_SESSION_KEY = 'spelling-session'

export const SpellingSessionManager = {
  // Save spelling session to localStorage
  saveSession: (sessionData: SpellingSessionData): void => {
    try {
      const dataToSave = {
        ...sessionData,
        lastUpdated: Date.now()
      }
      localStorage.setItem(SPELLING_SESSION_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Failed to save spelling session:', error)
    }
  },

  // Load spelling session from localStorage
  loadSession: (): SpellingSessionData | null => {
    try {
      const saved = localStorage.getItem(SPELLING_SESSION_KEY)
      if (!saved) return null

      const sessionData: SpellingSessionData = JSON.parse(saved)
      
      // Check if session is expired (older than 24 hours)
      const isExpired = Date.now() - sessionData.createdAt > 24 * 60 * 60 * 1000
      if (isExpired) {
        SpellingSessionManager.clearSession()
        return null
      }

      return sessionData
    } catch (error) {
      console.error('Failed to load spelling session:', error)
      SpellingSessionManager.clearSession()
      return null
    }
  },

  // Clear spelling session from localStorage
  clearSession: (): void => {
    try {
      localStorage.removeItem(SPELLING_SESSION_KEY)
    } catch (error) {
      console.error('Failed to clear spelling session:', error)
    }
  },

  // Check if there's an active session
  hasActiveSession: (): boolean => {
    return SpellingSessionManager.loadSession() !== null
  },

  // Create a new session ID
  createSessionId: (): string => {
    return `spelling-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Create initial word attempt record
  createWordAttempt: (word: VocabularyWord): SpellingWordAttempt => ({
    wordId: word.id,
    word,
    attempts: [],
    completed: false,
    pointsEarned: 0
  }),

  // Add attempt to word record
  addWordAttempt: (
    wordAttempt: SpellingWordAttempt,
    answer: string,
    hintLevel: HintLevel,
    isCorrect: boolean
  ): SpellingWordAttempt => {
    const newAttempt = {
      answer,
      hintLevel,
      isCorrect,
      timestamp: Date.now()
    }

    return {
      ...wordAttempt,
      attempts: [...wordAttempt.attempts, newAttempt],
      completed: isCorrect,
      finalAnswer: isCorrect ? answer : wordAttempt.finalAnswer,
      finalHintLevel: isCorrect ? hintLevel : wordAttempt.finalHintLevel,
      pointsEarned: isCorrect ? Math.max(10 - (hintLevel * 2), 2) : wordAttempt.pointsEarned
    }
  }
}
