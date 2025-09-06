import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Volume2, VolumeX, Lightbulb, RotateCcw, CheckCircle, XCircle, Trophy, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { useAuth } from '@/contexts/AuthContext'
import { VocabularyWord } from '@/types'
import toast from 'react-hot-toast'

type HintLevel = 0 | 1 | 2 | 3 | 4 | 5

interface SpellingSessionStats {
  wordsAttempted: number
  wordsCorrect: number
  totalHintsUsed: number
  totalTime: number
  pointsEarned: number
}

export function SpellingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    words,
    currentWord,
    startLearningSession,
    getNextWord,
    updateProgress,
    fetchVocabularyLists,
    setCurrentList,
    vocabularyLists
  } = useVocabularyStore()
  
  // Session state
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [hintLevel, setHintLevel] = useState<HintLevel>(0)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [sessionStats, setSessionStats] = useState<SpellingSessionStats>({
    wordsAttempted: 0,
    wordsCorrect: 0,
    totalHintsUsed: 0,
    totalTime: 0,
    pointsEarned: 0
  })
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now())
  const [wordStartTime, setWordStartTime] = useState<number>(Date.now())
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [initializationError, setInitializationError] = useState(false)
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.error('Spelling session initialization timeout')
          setInitializationError(true)
        }, 10000) // 10 second timeout
        
        // Fetch vocabulary lists if not already loaded
        if (vocabularyLists.length === 0) {
          await fetchVocabularyLists()
        }
        
        // Wait a bit for the store to update
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Get the updated lists from the store
        const currentLists = useVocabularyStore.getState().vocabularyLists
        if (currentLists.length > 0) {
          const defaultList = currentLists.find(list => list.is_default) || currentLists[0]
          if (defaultList) {
            await setCurrentList(defaultList)
          }
        } else {
          console.error('No vocabulary lists available')
          setInitializationError(true)
          clearTimeout(timeoutId)
          return
        }
        
        // Wait for words to be loaded
        await new Promise(resolve => setTimeout(resolve, 100))
        const currentWords = useVocabularyStore.getState().words
        
        if (currentWords.length > 0) {
          startSpellingSession()
        } else {
          console.error('No words available for the selected list')
          setInitializationError(true)
        }
        
        clearTimeout(timeoutId)
      } catch (error) {
        console.error('Error initializing spelling session:', error)
        setInitializationError(true)
      }
    }
    
    initializeSession()
  }, [])
  
  // Note: Removed automatic audio playback - browsers require user interaction
  
  const startSpellingSession = () => {
    startLearningSession('spelling')
    setSessionActive(true)
    setSessionStartTime(Date.now())
    setWordStartTime(Date.now())
    resetWordState()
  }
  
  const resetWordState = () => {
    setCurrentAnswer('')
    setHintLevel(0)
    setIsCorrect(null)
    setShowFeedback(false)
    setWordStartTime(Date.now())
  }
  
  const playWordAudio = async () => {
    if (!currentWord || !audioEnabled) return
    
    try {
      setIsPlaying(true)
      // Use sort_order for audio file naming since audio files are numbered sequentially
      const audioId = currentWord.sort_order ? currentWord.sort_order.toString().padStart(3, '0') : '001'
      const audioUrl = `/audio/word_${audioId}_${currentWord.word}.mp3`
      
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      // Create new audio element
      audioRef.current = new Audio(audioUrl)
      audioRef.current.volume = 0.8
      
      // Set up event handlers
      audioRef.current.onended = () => setIsPlaying(false)
      audioRef.current.onerror = (e) => {
        setIsPlaying(false)
        console.error(`Audio error for word: ${currentWord.word}`, e)
      }
      
      // Play the audio
      await audioRef.current.play()
    } catch (error) {
      setIsPlaying(false)
      console.error('Error playing audio:', error)
      // Don't show error to user for autoplay policy issues
      if (error.name !== 'NotAllowedError') {
        console.warn(`Audio not available for word: ${currentWord.word}`)
      }
    }
  }
  
  const getWordHint = (word: string, level: HintLevel): string => {
    if (!word) return ''
    
    switch (level) {
      case 0:
        return '' // No hint
      case 1:
        return word.split('').map(() => '_').join(' ') // Show length
      case 2:
        return word[0] + ' ' + word.slice(1).split('').map(() => '_').join(' ') // First letter
      case 3:
        return word[0] + ' ' + word.slice(1, -1).split('').map(() => '_').join(' ') + ' ' + word[word.length - 1] // First and last
      case 4:
        return `Definition: ${currentWord?.definition || 'A word you need to spell'}` // Definition
      case 5:
        return word.toUpperCase() // Show complete word
      default:
        return ''
    }
  }
  
  const handleHintRequest = () => {
    if (hintLevel < 5) {
      setHintLevel((prev) => (prev + 1) as HintLevel)
      setSessionStats(prev => ({
        ...prev,
        totalHintsUsed: prev.totalHintsUsed + 1
      }))
    }
  }
  
  const checkSpelling = () => {
    if (!currentWord || !currentAnswer.trim()) return
    
    const correct = currentAnswer.toLowerCase().trim() === currentWord.word.toLowerCase()
    const responseTime = (Date.now() - wordStartTime) / 1000
    
    setIsCorrect(correct)
    setShowFeedback(true)
    
    // Calculate points based on hints used and correctness
    let points = 0
    if (correct) {
      points = Math.max(10 - (hintLevel * 2), 2) // Base 10 points, -2 per hint, minimum 2
      toast.success(`Correct! +${points} points!`, {
        icon: '🎉',
        duration: 2000,
      })
    } else {
      toast.error('Try again!', {
        icon: '💪',
        duration: 1500,
      })
    }
    
    // Update stats
    setSessionStats(prev => ({
      ...prev,
      wordsAttempted: prev.wordsAttempted + 1,
      wordsCorrect: prev.wordsCorrect + (correct ? 1 : 0),
      pointsEarned: prev.pointsEarned + points,
      totalTime: (Date.now() - sessionStartTime) / 1000
    }))
    
    // Update progress in backend
    if (user && currentWord) {
      updateProgress(currentWord.id, correct, responseTime)
    }
    
    // Auto-advance after feedback
    setTimeout(() => {
      if (correct) {
        handleNextWord()
      } else {
        setShowFeedback(false)
        setCurrentAnswer('')
      }
    }, 2000)
  }
  
  const handleNextWord = () => {
    const nextWord = getNextWord()
    if (nextWord) {
      resetWordState()
    } else {
      // Session complete
      setSessionComplete(true)
      setSessionActive(false)
      const totalTime = (Date.now() - sessionStartTime) / 1000
      setSessionStats(prev => ({
        ...prev,
        totalTime
      }))
    }
  }
  
  const handleSkipWord = () => {
    if (hintLevel < 5) {
      setHintLevel(5) // Show the complete word
      setTimeout(() => {
        handleNextWord()
      }, 3000)
    } else {
      handleNextWord()
    }
  }
  
  const restartSession = () => {
    setSessionComplete(false)
    setSessionStats({
      wordsAttempted: 0,
      wordsCorrect: 0,
      totalHintsUsed: 0,
      totalTime: 0,
      pointsEarned: 0
    })
    startSpellingSession()
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentAnswer(e.target.value)
    if (showFeedback) {
      setShowFeedback(false)
      setIsCorrect(null)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showFeedback) {
      checkSpelling()
    }
  }
  
  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Session Complete!</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{sessionStats.wordsCorrect}</div>
                <div className="text-sm text-gray-600">Words Correct</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{sessionStats.pointsEarned}</div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{Math.round(sessionStats.totalTime)}s</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {sessionStats.wordsAttempted > 0 ? Math.round((sessionStats.wordsCorrect / sessionStats.wordsAttempted) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={restartSession}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-200"
              >
                <RotateCcw className="w-5 h-5 inline mr-2" />
                Play Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }
  
  if (initializationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Loading Error</h2>
              <p className="text-red-600 mb-4">
                There was an issue loading the spelling session.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionActive || !currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading spelling session...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Target className="w-4 h-4" />
                <span>{sessionStats.wordsCorrect}/{sessionStats.wordsAttempted}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
                <Trophy className="w-4 h-4" />
                <span>{sessionStats.pointsEarned} pts</span>
              </div>
            </div>
            
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                audioEnabled 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {/* Audio Control */}
          <div className="text-center mb-8">
            <button
              onClick={playWordAudio}
              disabled={isPlaying || !audioEnabled}
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 ${
                isPlaying
                  ? 'bg-green-200 text-green-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 hover:scale-105 shadow-lg'
              }`}
            >
              <Volume2 className={`w-8 h-8 ${isPlaying ? 'animate-pulse' : ''}`} />
            </button>
            <p className="text-gray-600 mt-3 text-lg">
              {isPlaying ? 'Playing pronunciation...' : 'Click to hear the word'}
            </p>
          </div>
          
          {/* Hint Display */}
          <div className="text-center mb-8">
            <AnimatePresence mode="wait">
              {hintLevel > 0 && (
                <motion.div
                  key={hintLevel}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4"
                >
                  <div className="flex items-center justify-center space-x-2 text-yellow-700">
                    <Lightbulb className="w-5 h-5" />
                    <span className="font-medium">Hint {hintLevel}</span>
                  </div>
                  <div className="mt-2 text-lg font-mono tracking-wider">
                    {getWordHint(currentWord.word, hintLevel)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Spelling Input */}
          <div className="mb-6">
            <input
              type="text"
              value={currentAnswer}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type the spelling here..."
              disabled={showFeedback}
              className={`w-full text-2xl text-center p-4 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 ${
                showFeedback
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
              }`}
            />
          </div>
          
          {/* Feedback */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`text-center mb-6 p-4 rounded-lg ${
                  isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2 text-lg font-medium">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span>Excellent! Correct spelling!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6" />
                      <span>Not quite right. Keep trying!</span>
                    </>
                  )}
                </div>
                {isCorrect && (
                  <div className="mt-2 text-sm">
                    <strong>{currentWord.word}</strong> - {currentWord.definition}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!showFeedback && (
              <>
                <button
                  onClick={checkSpelling}
                  disabled={!currentAnswer.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check Spelling
                </button>
                
                <button
                  onClick={handleHintRequest}
                  disabled={hintLevel >= 5}
                  className="px-6 py-3 bg-yellow-100 text-yellow-700 rounded-xl font-medium hover:bg-yellow-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lightbulb className="w-4 h-4 inline mr-2" />
                  {hintLevel >= 5 ? 'All hints used' : 'Get Hint'}
                </button>
                
                <button
                  onClick={handleSkipWord}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  Skip Word
                </button>
              </>
            )}
          </div>
        </motion.div>
        
        {/* Progress Bar */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Session Progress</span>
            <span className="text-sm text-gray-500">{sessionStats.wordsAttempted} words attempted</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-600 to-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${sessionStats.wordsAttempted > 0 ? (sessionStats.wordsCorrect / sessionStats.wordsAttempted) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}