import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Volume2, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  RotateCcw,
  Lightbulb,
  BookOpen,
  Play
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

type FlashcardSide = 'front' | 'back'
type DifficultyRating = 'easy' | 'good' | 'hard'

export function FlashcardsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentWord,
    currentSessionWords,
    sessionMode,
    startLearningSession,
    getNextWord,
    updateProgress,
    words
  } = useVocabularyStore()

  const [currentSide, setCurrentSide] = useState<FlashcardSide>('front')
  const [showHint, setShowHint] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0,
    startTime: Date.now()
  })

  useEffect(() => {
    if (!sessionStarted && words.length > 0) {
      startSession()
    }
  }, [words, sessionStarted])

  const startSession = () => {
    startLearningSession('flashcards')
    setSessionStarted(true)
    setSessionStats({
      correct: 0,
      total: 0,
      startTime: Date.now()
    })
  }

  const flipCard = () => {
    setCurrentSide(currentSide === 'front' ? 'back' : 'front')
  }

  const playAudio = () => {
    if (currentWord?.audio_url) {
      const audio = new Audio(currentWord.audio_url)
      audio.play().catch((error) => {
        console.error('Error playing audio:', error)
        toast.error('Could not play pronunciation')
      })
    }
  }

  const handleDifficultyRating = async (rating: DifficultyRating) => {
    if (!currentWord || !user) return

    const isCorrect = rating === 'easy' || rating === 'good'
    const responseTime = (Date.now() - sessionStats.startTime) / 1000

    await updateProgress(currentWord.id, isCorrect, responseTime)
    
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))

    const nextWord = getNextWord()
    if (nextWord) {
      setCurrentIndex(prev => prev + 1)
      setCurrentSide('front')
      setShowHint(false)
    } else {
      // Session complete
      const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100)
      toast.success(`Session complete! Accuracy: ${accuracy}%`)
      navigate('/dashboard')
    }
  }

  const resetCard = () => {
    setCurrentSide('front')
    setShowHint(false)
  }

  if (!currentWord && sessionMode === 'flashcards') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Preparing your flashcards...</p>
        </div>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Learn?</h2>
          <p className="text-gray-600 mb-6">
            Start your flashcard session to learn new vocabulary words!
          </p>
          <button
            onClick={startSession}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>Start Learning</span>
          </button>
        </div>
      </div>
    )
  }

  const progress = ((currentIndex + 1) / currentSessionWords.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-800">Flashcards</h1>
              <p className="text-sm text-gray-600">
                Card {currentIndex + 1} of {currentSessionWords.length}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">
                {sessionStats.correct}/{sessionStats.total}
              </p>
              <p className="text-xs text-gray-600">Correct</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white/60 border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full bg-gray-200 rounded-full h-2 my-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center">
          {/* Flashcard */}
          <motion.div 
            className="w-full max-w-2xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div 
              className="relative h-80 cursor-pointer"
              onClick={flipCard}
            >
              <AnimatePresence mode="wait">
                {currentSide === 'front' ? (
                  <motion.div
                    key="front"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-white"
                  >
                    <div className="text-center px-8">
                      <h2 className="text-4xl font-bold mb-4">{currentWord.word}</h2>
                      <p className="text-blue-100 text-lg capitalize mb-6">
                        {currentWord.part_of_speech}
                      </p>
                      
                      {/* Audio Button */}
                      {currentWord.audio_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            playAudio()
                          }}
                          className="bg-white/20 hover:bg-white/30 p-4 rounded-full transition-all duration-200 transform hover:scale-110"
                        >
                          <Volume2 className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                    
                    <div className="absolute bottom-4 text-center">
                      <p className="text-blue-100 text-sm">Click to see definition</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-white p-8"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-4">{currentWord.word}</h3>
                      <p className="text-green-100 text-lg mb-6 leading-relaxed">
                        {currentWord.simple_definition || currentWord.definition}
                      </p>
                      
                      <div className="bg-white/20 rounded-xl p-4 mb-4">
                        <p className="text-green-50 italic">
                          "{currentWord.example_sentence}"
                        </p>
                      </div>
                      
                      {/* Synonyms */}
                      {currentWord.synonyms.length > 0 && (
                        <div className="mb-4">
                          <p className="text-green-100 text-sm mb-2">Similar words:</p>
                          <p className="text-white font-medium">
                            {currentWord.synonyms.slice(0, 3).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-4 text-center">
                      <p className="text-green-100 text-sm">Click to see word again</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <button
              onClick={playAudio}
              disabled={!currentWord.audio_url}
              className="flex items-center space-x-2 px-4 py-2 bg-white/60 hover:bg-white/80 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>Pronounce</span>
            </button>
            
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/60 hover:bg-white/80 rounded-xl transition-all duration-200"
            >
              {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showHint ? 'Hide' : 'Show'} Hint</span>
            </button>
            
            <button
              onClick={resetCard}
              className="flex items-center space-x-2 px-4 py-2 bg-white/60 hover:bg-white/80 rounded-xl transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Hint */}
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 max-w-2xl w-full"
            >
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Hint</h4>
                  <p className="text-yellow-700 text-sm">
                    {currentWord.pronunciation_guide && (
                      <span className="block mb-1">
                        <strong>Pronunciation:</strong> {currentWord.pronunciation_guide}
                      </span>
                    )}
                    {currentWord.etymology && (
                      <span className="block mb-1">
                        <strong>Origin:</strong> {currentWord.etymology}
                      </span>
                    )}
                    <span className="block">
                      <strong>First letter:</strong> {currentWord.definition[0].toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Difficulty Buttons (only show after seeing back) */}
          {currentSide === 'back' && (
            <motion.div 
              className="flex space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => handleDifficultyRating('hard')}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <X className="w-5 h-5" />
                <span>Hard</span>
              </button>
              
              <button
                onClick={() => handleDifficultyRating('good')}
                className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <span>Good</span>
              </button>
              
              <button
                onClick={() => handleDifficultyRating('easy')}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <Check className="w-5 h-5" />
                <span>Easy</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}