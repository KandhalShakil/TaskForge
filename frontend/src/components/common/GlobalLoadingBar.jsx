import { motion, AnimatePresence } from 'framer-motion'
import { useLoadingStore } from '../../store/useLoadingStore'

export default function GlobalLoadingBar() {
  const activeRequests = useLoadingStore((state) => state.activeRequests)
  const isLoading = activeRequests > 0

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ width: '0%', opacity: 1 }}
          animate={{ 
            width: '100%',
            transition: { 
              duration: 15, 
              ease: "easeOut" 
            }
          }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.2 }
          }}
          className="fixed top-0 left-0 h-0.5 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 z-[9999] shadow-[0_0_8px_rgba(99,102,241,0.5)]"
          style={{ width: '0%' }}
        >
          {/* Animated glow pulse */}
          <motion.div 
            animate={{ 
              opacity: [0.4, 1, 0.4],
              boxShadow: [
                "0 0 0px rgba(99,102,241,0)",
                "0 0 10px rgba(99,102,241,0.8)",
                "0 0 0px rgba(99,102,241,0)"
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-0 right-0 h-full w-20 bg-white blur-sm"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
