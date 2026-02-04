import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { Button } from './ui/button';

const AchievementNotification = ({ achievement, onClose }) => {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed top-20 right-4 z-50 max-w-sm"
          data-testid="achievement-notification"
        >
          <div className="bg-gradient-to-br from-accent-gold/20 to-accent-orange/20 border-2 border-accent-gold rounded-lg p-4 backdrop-blur-md shadow-2xl">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Trophy className="text-accent-gold" size={32} />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-dark-primary mb-1">
                  Досягнення розблоковано!
                </h3>
                <p className="text-accent-gold font-bold mb-1">{achievement.title}</p>
                <p className="text-sm text-text-dark-secondary mb-2">{achievement.description}</p>
                <div className="flex gap-2 text-xs">
                  <span className="text-accent-gold">+{achievement.xpReward} XP</span>
                  <span className="text-accent-gold">+{achievement.coinReward} монет</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-text-dark-secondary hover:text-text-dark-primary"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementNotification;