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
  Clock,
  Brain,
  Play,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { VocabularyWord, QuizType } from '@/types'
import { QuizSessionManager, QuizSessionData } from '@/lib/quizSession'
import { QuizQuestion as DatabaseQuizQuestion } from '@/types'
import toast from 'react-hot-toast'

// Local QuizQuestion interface for UI with both database and UI properties
interface QuizQuestion extends DatabaseQuizQuestion {
  type: string
  question: string
  correctAnswer: string
  userAnswer?: string
  isCorrect?: boolean
  word?: any // VocabularyWord
}

export function QuizPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentWord,
    currentSessionWords,
    sessionMode,
    startLearningSession,
    getNextWord,
    updateProgress,
    words,
    getRandomWords
  } = useVocabularyStore()


  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0,
    startTime: Date.now()
  })
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isResuming, setIsResuming] = useState(false)

  useEffect(() => {
    if (!sessionStarted && words.length > 0) {
      // Check for existing session first
      const existingSession = QuizSessionManager.loadSession()
      if (existingSession && existingSession.userId === user?.id) {
        resumeSession(existingSession)
      } else {
        startNewSession()
      }
    }
  }, [words, sessionStarted, user?.id])

  // Save session state whenever it changes
  useEffect(() => {
    if (sessionStarted && sessionId && questions.length > 0) {
      saveSessionState()
    }
  }, [questions, currentQuestionIndex, sessionStats, sessionStarted, sessionId])

  const startNewSession = () => {
    const newSessionId = QuizSessionManager.createSessionId()
    setSessionId(newSessionId)
    startLearningSession('quiz')
    generateQuestions()
    setSessionStarted(true)
    setSessionStats({
      correct: 0,
      total: 0,
      startTime: Date.now()
    })
    setQuestionStartTime(Date.now())
  }

  const resumeSession = (sessionData: QuizSessionData) => {
    // Map the session data to match the expected format
    const mappedQuestions: QuizQuestion[] = sessionData.questions.map(q => ({
      ...q,
      type: q.question_type,
      question: q.question_text,
      correctAnswer: q.correct_answer,
      userAnswer: (q as any).userAnswer,
      isCorrect: (q as any).isCorrect,
      word: (q as any).word
    }))
    
    setIsResuming(true)
    setSessionId(sessionData.sessionId)
    setQuestions(mappedQuestions)
    setCurrentQuestionIndex(sessionData.currentQuestionIndex)
    setSessionStats(sessionData.sessionStats)
    setSessionStarted(true)
    
    // Set selected answer for current question if already answered
    const currentQuestion = mappedQuestions[sessionData.currentQuestionIndex]
    if (currentQuestion?.userAnswer) {
      setSelectedAnswer(currentQuestion.userAnswer)
    }
    
    setQuestionStartTime(Date.now())
    setIsResuming(false)
    
    toast.success(`Resumed quiz session (${sessionData.currentQuestionIndex + 1}/${sessionData.questions.length} questions)`)
  }

  const saveSessionState = () => {
    if (!user?.id || !sessionId) return
    
    const sessionData: QuizSessionData = {
      sessionId,
      userId: user.id,
      questions,
      currentQuestionIndex,
      sessionStats,
      createdAt: sessionStats.startTime,
      lastUpdated: Date.now()
    }
    
    QuizSessionManager.saveSession(sessionData)
  }

  const generateQuestions = () => {
    // Use currentSessionWords if available, otherwise fall back to words array
    const availableWords = currentSessionWords.length > 0 ? currentSessionWords : words
    const sessionWords = availableWords.slice(0, 15) // Limit to 15 questions
    const quizQuestions: QuizQuestion[] = []


    if (sessionWords.length === 0) {
      toast.error('No vocabulary words available. Please try again.')
      return
    }

    sessionWords.forEach((word, index) => {
      const questionTypes: QuizType[] = ['multiple_choice', 'fill_blank']
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)]

      let question: QuizQuestion

      switch (questionType) {
        case 'multiple_choice':
          question = generateMultipleChoice(word)
          break
        case 'fill_blank':
          question = generateFillBlank(word)
          break
        default:
          question = generateMultipleChoice(word)
      }

      quizQuestions.push(question)
    })

    setQuestions(quizQuestions)
  }

  const generateMultipleChoice = (word: VocabularyWord): QuizQuestion => {
    const incorrectWords = getRandomWords(3, [word.id])
    const allOptions = [word.definition, ...incorrectWords.map(w => w.definition)]
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5)

    return {
      // Database properties
      id: word.id,
      word_id: word.id,
      question_type: 'multiple_choice' as QuizType,
      question_text: `What does "${word.word}" mean?`,
      options: shuffledOptions,
      correct_answer: word.definition,
      difficulty_level: 1,
      // UI properties
      word,
      type: 'multiple_choice',
      question: `What does "${word.word}" mean?`,
      correctAnswer: word.definition
    }
  }

  const generateFillBlank = (word: VocabularyWord): QuizQuestion => {
    const sentence = word.example_sentence
    const wordRegex = new RegExp(`\\b${word.word}\\b`, 'gi')
    const questionSentence = sentence.replace(wordRegex, '______')

    return {
      // Database properties
      id: word.id,
      word_id: word.id,
      question_type: 'fill_blank' as QuizType,
      question_text: `Fill in the blank: ${questionSentence}`,
      correct_answer: word.word,
      difficulty_level: 1,
      // UI properties
      word,
      type: 'fill_blank',
      question: `Fill in the blank: ${questionSentence}`,
      correctAnswer: word.word
    }
  }

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer) return

    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = selectedAnswer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim()
    const responseTime = (Date.now() - questionStartTime) / 1000

    // Update question with user answer
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect
    }
    setQuestions(updatedQuestions)

    // Update progress in backend
    await updateProgress(currentQuestion.word.id, isCorrect, responseTime)

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))

    setShowResult(true)

    // Auto advance after 2 seconds (only if not manually navigating)
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        handleNextQuestion()
      }
    }, 2000)
  }

  const handleNextQuestion = () => {
    setShowResult(false)
    setSelectedAnswer('')
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setQuestionStartTime(Date.now())
      
      // Set selected answer for next question if already answered
      const nextQuestion = questions[currentQuestionIndex + 1]
      if (nextQuestion?.userAnswer) {
        setSelectedAnswer(nextQuestion.userAnswer)
      }
    } else {
      // Quiz complete
      const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100)
      toast.success(`Quiz complete! Accuracy: ${accuracy}%`)
      QuizSessionManager.clearSession()
      navigate('/dashboard')
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setShowResult(false)
      setCurrentQuestionIndex(prev => prev - 1)
      setQuestionStartTime(Date.now())
      
      // Set selected answer for previous question if already answered
      const prevQuestion = questions[currentQuestionIndex - 1]
      if (prevQuestion?.userAnswer) {
        setSelectedAnswer(prevQuestion.userAnswer)
      } else {
        setSelectedAnswer('')
      }
    }
  }

  const handleAbandonQuiz = () => {
    if (confirm('Are you sure you want to abandon this quiz? Your progress will be saved.')) {
      QuizSessionManager.clearSession()
      navigate('/dashboard')
    }
  }

  const playAudio = (word: VocabularyWord) => {
    if (word.audio_url) {
      const audio = new Audio(word.audio_url)
      audio.play().catch((error) => {
        console.error('Error playing audio:', error)
      })
    }
  }

  if (isResuming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <LoadingSpinner />
          <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-4">Resuming Quiz...</h2>
          <p className="text-gray-600">
            Loading your previous quiz session
          </p>
        </div>
      </div>
    )
  }

  if (!sessionStarted || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready for a Quiz?</h2>
          <p className="text-gray-600 mb-6">
            Test your knowledge with multiple choice and fill-in-the-blank questions!
          </p>
          <button
            onClick={startNewSession}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>Start Quiz</span>
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Safety check - if no current question, show loading
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading question...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <button
                onClick={handleAbandonQuiz}
                className="text-red-600 hover:text-red-800 transition-colors text-sm"
              >
                Abandon Quiz
              </button>
            </div>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-800">Quiz Mode</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
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
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            {/* Question Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <span className="text-purple-600 font-medium capitalize">
                    {currentQuestion.type?.replace('_', ' ') || 'Question'}
                  </span>
                </div>
                
                {currentQuestion.word?.audio_url && (
                  <button
                    onClick={() => playAudio(currentQuestion.word)}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                  >
                    <Volume2 className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-600 text-sm">Listen</span>
                  </button>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {currentQuestion.question || 'Loading question...'}
              </h2>
              
              {/* Question Type Specific Content */}
              {currentQuestion.type === 'multiple_choice' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(option)}
                      disabled={showResult}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        selectedAnswer === option
                          ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500'
                          : 'bg-white/70 border-gray-200 hover:bg-white/90 hover:border-purple-200'
                      } ${showResult ? 'pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800">{option}</span>
                        {showResult && (
                          <div>
                            {option === currentQuestion.correctAnswer ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : selectedAnswer === option ? (
                              <X className="w-5 h-5 text-red-500" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {currentQuestion.type === 'fill_blank' && (
                <div>
                  <input
                    type="text"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    disabled={showResult}
                    placeholder="Type your answer here..."
                    className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 text-gray-800 placeholder-gray-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && selectedAnswer && !showResult) {
                        handleAnswerSubmit()
                      }
                    }}
                  />
                  
                  {showResult && (
                    <div className="mt-4 p-4 rounded-xl bg-gray-50 border">
                      <div className="flex items-center space-x-2 mb-2">
                        {currentQuestion.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`font-medium ${
                          currentQuestion.isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {currentQuestion.isCorrect ? 'Correct!' : 'Incorrect'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Correct answer: <strong>{currentQuestion.correctAnswer}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            {!showResult && (
              <div className="text-center">
                <button
                  onClick={handleAnswerSubmit}
                  disabled={!selectedAnswer}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  <Check className="w-5 h-5" />
                  <span>Submit Answer</span>
                </button>
              </div>
            )}

            {/* Result Display */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-medium ${
                  currentQuestion.isCorrect 
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {currentQuestion.isCorrect ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                  <span>
                    {currentQuestion.isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                
                {!currentQuestion.isCorrect && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-medium text-blue-800 mb-2">
                      {currentQuestion.word.word}
                    </h4>
                    <p className="text-blue-600 text-sm mb-2">
                      {currentQuestion.word.definition}
                    </p>
                    <p className="text-blue-500 text-xs italic">
                      "{currentQuestion.word.example_sentence}"
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                {currentQuestion?.userAnswer && (
                  <span className="text-green-600">✓ Answered</span>
                )}
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex >= questions.length - 1}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}