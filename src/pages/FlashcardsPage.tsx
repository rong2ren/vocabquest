import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Volume2, 
  Check, 
  X, 
  RotateCcw,
  BookOpen,
  Play
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

type FlashcardSide = 'front' | 'back'
type DifficultyRating = 'easy' | 'good' | 'hard'

export function FlashcardsPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const {
    updateProgress,
    words,
    vocabularyLists,
    fetchVocabularyLists,
    fetchWordsForList,
    setCurrentList
  } = useVocabularyStore()

  const [currentSide, setCurrentSide] = useState<FlashcardSide>('front')
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Load last position from localStorage, default to 0
    const savedIndex = localStorage.getItem('flashcards-last-position')
    return savedIndex ? parseInt(savedIndex, 10) : 0
  })
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0,
    startTime: Date.now()
  })

  // Simple initialization - just load words if not already loaded
  useEffect(() => {
    const loadData = async () => {
      if (words.length === 0 && user) {
        try {
          // Load vocabulary lists if needed
          if (vocabularyLists.length === 0) {
            await fetchVocabularyLists()
          }
          
          // Get the default list and load words
          const { vocabularyLists: currentLists } = useVocabularyStore.getState()
          if (currentLists.length > 0) {
            const defaultList = currentLists.find(list => list.is_default) || currentLists[0]
            setCurrentList(defaultList)
            await fetchWordsForList(defaultList.id)
          }
          
        } catch (error) {
          console.error('Error loading data:', error)
          toast.error('Failed to load vocabulary data')
        }
      }
    }
    
    loadData()
  }, [user])

  // Save current position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('flashcards-last-position', currentIndex.toString())
  }, [currentIndex])

  // Get current word from the words array using currentIndex
  const currentWord = words[currentIndex] || null

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

    // Update progress in backend
    await updateProgress(currentWord.id, isCorrect, responseTime)
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))

    // Move to next word
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setCurrentSide('front')
    } else {
      // Session complete - went through all words
      const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100)
      toast.success(`Session complete! Accuracy: ${accuracy}%`)
      
      // Refresh profile to show updated stats immediately
      await refreshProfile()
      
      navigate('/dashboard')
    }
  }


  // Show loading if no words loaded yet
  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    )
  }

  // Show completion message if we've gone through all words
  if (currentIndex >= words.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">All Done!</h2>
          <p className="text-gray-600 mb-6">You've completed all {words.length} flashcards!</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
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
            onClick={() => {
              // Start from saved position (or word 1 if no saved position)
              setCurrentSide('front')
              setSessionStats({
                correct: 0,
                total: 0,
                startTime: Date.now()
              })
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>Start Learning</span>
          </button>
        </div>
      </div>
    )
  }

  const progress = ((currentIndex + 1) / words.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={async () => {
                await refreshProfile()
                navigate('/dashboard')
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-800">Flashcards</h1>
              <p className="text-sm text-gray-600">
                Card {currentIndex + 1} of {words.length}
                {currentIndex > 0 && (
                  <span className="text-xs text-blue-600 ml-2">(resumed from last position)</span>
                )}
              </p>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="text-xs px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
                >
                  ← Prev
                </button>
                <input
                  type="number"
                  min="1"
                  max={words.length}
                  value={currentIndex + 1}
                  onChange={(e) => {
                    const newIndex = Math.max(0, Math.min(words.length - 1, parseInt(e.target.value) - 1))
                    setCurrentIndex(newIndex)
                  }}
                  className="w-12 text-xs text-center border rounded"
                />
                <button
                  onClick={() => setCurrentIndex(Math.min(words.length - 1, currentIndex + 1))}
                  disabled={currentIndex === words.length - 1}
                  className="text-xs px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
                >
                  Next →
                </button>
                <button
                  onClick={() => setCurrentIndex(0)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  title="Start from beginning"
                >
                  ↺ Start Over
                </button>
              </div>
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
              className="relative h-96 cursor-pointer"
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
                    className="absolute inset-0 bg-white border-2 border-gray-200 rounded-2xl shadow-lg flex flex-col items-center justify-center"
                  >
                    <div className="text-center px-8">
                      <h2 className="text-5xl font-light text-gray-800 mb-2">{currentWord.word}</h2>
                      <p className="text-gray-500 text-lg capitalize mb-8">
                        {currentWord.part_of_speech}
                      </p>
                      
                      {/* Audio Button */}
                      {currentWord.audio_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            playAudio()
                          }}
                          className="bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-all duration-200"
                        >
                          <Volume2 className="w-5 h-5 text-gray-600" />
                        </button>
                      )}
                    </div>
                    
                    <div className="absolute bottom-6 text-center">
                      <p className="text-gray-400 text-sm">Tap to reveal</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-white border-2 border-gray-200 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8"
                  >
                    <div className="text-center w-full">
                      <h3 className="text-2xl font-medium text-gray-800 mb-4">{currentWord.word}</h3>
                      <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                        {currentWord.simple_definition || currentWord.definition}
                      </p>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-600 italic">
                          "{currentWord.example_sentence}"
                        </p>
                      </div>
                      
                      {/* Synonyms and Antonyms */}
                      <div className="space-y-4">
                        {/* Synonyms */}
                        {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-blue-700 text-sm mb-1 font-medium">Similar words:</p>
                            <p className="text-blue-800">
                              {currentWord.synonyms.slice(0, 3).join(', ')}
                            </p>
                          </div>
                        )}
                        
                        {/* Antonyms */}
                        {currentWord.antonyms && currentWord.antonyms.length > 0 && (
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-red-700 text-sm mb-1 font-medium">Opposite words:</p>
                            <p className="text-red-800">
                              {currentWord.antonyms.slice(0, 3).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
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
              onClick={() => setCurrentSide('front')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/60 hover:bg-white/80 rounded-xl transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>


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
                <span>Need Practice</span>
              </button>
              
              <button
                onClick={() => handleDifficultyRating('good')}
                className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <span>Know It</span>
              </button>
              
              <button
                onClick={() => handleDifficultyRating('easy')}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <Check className="w-5 h-5" />
                <span>Know It Well</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}