import { motion } from 'framer-motion'
import { Star, CheckCircle, XCircle, Clock } from 'lucide-react'
import { VocabularyWord } from '@/types'

interface SessionSummaryProps {
  totalWords: number
  correctAnswers: number
  duration: number
  pointsEarned: number
  maxStreak: number
  wordsReviewed: Array<{
    word: VocabularyWord
    isCorrect: boolean
    responseTime: number
  }>
  onRestart: () => void
  onBackToDashboard: () => void
}

export function SessionSummary({
  totalWords,
  correctAnswers,
  duration,
  pointsEarned,
  maxStreak,
  wordsReviewed,
  onRestart,
  onBackToDashboard
}: SessionSummaryProps) {
  const accuracy = Math.round((correctAnswers / totalWords) * 100)
  const averageTime = wordsReviewed.reduce((acc, item) => acc + item.responseTime, 0) / wordsReviewed.length

  const getPerformanceMessage = () => {
    if (accuracy >= 90) return { message: "Outstanding! You're mastering these words!", color: "text-green-700" }
    if (accuracy >= 75) return { message: "Great job! You're doing really well!", color: "text-blue-700" }
    if (accuracy >= 60) return { message: "Good work! Keep practicing to improve!", color: "text-orange-700" }
    return { message: "Nice effort! Practice makes perfect!", color: "text-purple-700" }
  }

  const performanceMessage = getPerformanceMessage()

  return (
    <motion.div 
      className="max-w-4xl mx-auto p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <Star className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Session Complete!</h2>
        <p className={`text-lg font-medium ${performanceMessage.color}`}>
          {performanceMessage.message}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-2xl p-6 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-3xl font-bold text-green-800 mb-1">{correctAnswers}/{totalWords}</div>
          <div className="text-sm text-green-600 font-medium">Correct Answers</div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl p-6 text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">%</span>
          </div>
          <div className="text-3xl font-bold text-blue-800 mb-1">{accuracy}%</div>
          <div className="text-sm text-blue-600 font-medium">Accuracy</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl p-6 text-center">
          <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-3xl font-bold text-purple-800 mb-1">{pointsEarned}</div>
          <div className="text-sm text-purple-600 font-medium">Points Earned</div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-2xl p-6 text-center">
          <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-3xl font-bold text-orange-800 mb-1">{Math.round(averageTime)}s</div>
          <div className="text-sm text-orange-600 font-medium">Avg. Response</div>
        </div>
      </div>

      {/* Word Review */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Words Reviewed</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {wordsReviewed.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/40 rounded-xl">
              <div className="flex items-center space-x-3">
                {item.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <span className="font-medium text-gray-800">{item.word.word}</span>
                  <div className="text-sm text-gray-600 truncate max-w-xs">
                    {item.word.simple_definition || item.word.definition}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {Math.round(item.responseTime)}s
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onRestart}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Review Again
        </button>
        <button
          onClick={onBackToDashboard}
          className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-8 py-3 rounded-xl font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 border border-gray-300"
        >
          Back to Dashboard
        </button>
      </div>
    </motion.div>
  )
}
