import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Zap } from 'lucide-react';
import { Button } from './ui/button';

const LevelUpModal = ({ show, oldLevel, newLevel, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      // Play sound effect (optional)
      // new Audio('/sounds/levelup.mp3').play().catch(() => {});
    }
  }, [show]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        data-testid="level-up-modal"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Confetti effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: Math.random() * 0.5 + 0.5
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 800,
                    y: Math.random() * 600 + 200,
                    opacity: 0,
                    rotate: Math.random() * 360
                  }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                  style={{
                    background: ['#FFD700', '#6C63FF', '#2ECC71', '#E74C3C', '#F39C12'][Math.floor(Math.random() * 5)]
                  }}
                />
              ))}
            </div>
          )}

          {/* Main content */}
          <div className="bg-gradient-to-br from-bg-dark-card to-bg-dark border-2 border-accent-gold rounded-2xl p-12 text-center shadow-2xl max-w-lg">
            <motion.div
              animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              className="inline-block mb-6"
            >
              <Trophy size={80} className="text-accent-gold" />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-bold mb-4 bg-gradient-to-r from-accent-gold to-accent-orange bg-clip-text text-transparent"
            >
              РІВЕНЬ ПІДВИЩЕНО!
            </motion.h1>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              <span className="text-5xl font-bold text-text-dark-secondary">{oldLevel}</span>
              <Sparkles className="text-primary-main" size={40} />
              <span className="text-6xl font-bold text-primary-main">{newLevel}</span>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-lg text-text-dark-secondary mb-6 flex items-center justify-center gap-2"
            >
              <Zap className="text-accent-gold" size={20} />
              +3 очки характеристик отримано!
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-primary-main to-primary-dark hover:shadow-primary-glow text-lg px-8 py-6"
                data-testid="close-level-up-modal"
              >
                Чудово!
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LevelUpModal;