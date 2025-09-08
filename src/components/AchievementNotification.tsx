import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Flame, Target, Award, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Achievement } from '@/types'

interface AchievementNotificationProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (achievement) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  if (!achievement) return null

  const Icon = achievement.icon

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-sm"
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className={`bg-gradient-to-r ${achievement.color} text-white rounded-2xl p-6 shadow-2xl border border-white/20`}>
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-bold text-lg">{achievement.title}</h3>
                  <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                    +{achievement.points}
                  </div>
                </div>
                <p className="text-white/90 text-sm">{achievement.description}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Predefined achievements for the review system
export const REVIEW_ACHIEVEMENTS: Record<string, Achievement> = {
  FIRST_REVIEW: {
    id: 'first_review',
    title: 'First Steps!',
    description: 'Completed your first review session',
    icon: Star,
    color: 'from-blue-500 to-blue-600',
    points: 50
  },
  PERFECT_SESSION: {
    id: 'perfect_session',
    title: 'Perfect Score!',
    description: 'Got 100% accuracy in a review session',
    icon: Trophy,
    color: 'from-yellow-500 to-yellow-600',
    points: 100
  },
  STREAK_MASTER: {
    id: 'streak_master',
    title: 'Streak Master!',
    description: 'Got 5 correct answers in a row',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
    points: 75
  },
  QUICK_LEARNER: {
    id: 'quick_learner',
    title: 'Quick Learner!',
    description: 'Answered 10 questions in under 2 seconds each',
    icon: Zap,
    color: 'from-purple-500 to-purple-600',
    points: 80
  },
  DEDICATED_STUDENT: {
    id: 'dedicated_student',
    title: 'Dedicated Student!',
    description: 'Completed 5 review sessions',
    icon: Target,
    color: 'from-green-500 to-green-600',
    points: 150
  }
}
