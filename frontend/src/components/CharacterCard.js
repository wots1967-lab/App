import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { Coins, Zap } from 'lucide-react';

const CharacterCard = () => {
  const { user } = useAuth();
  const character = user?.character;

  if (!character) return null;

  const xpPercentage = (character.xp / character.xpToNextLevel) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      data-testid="character-card"
    >
      <Card className="bg-gradient-to-br from-bg-dark-card to-bg-dark border-white/10 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-4xl font-bold text-white shadow-primary-glow">
                {character.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-accent-gold text-bg-dark text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                Рівень {character.level}
              </div>
            </div>

            {/* Character Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-text-dark-primary" data-testid="character-name">
                    {character.name}
                  </h2>
                  <p className="text-sm text-text-dark-secondary">{character.title}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-accent-gold" data-testid="coins-display">
                    <Coins size={20} />
                    <span className="font-bold">{character.coins}</span>
                  </div>
                </div>
              </div>

              {/* XP Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-text-dark-secondary">
                  <span>Досвід</span>
                  <span data-testid="xp-display">
                    {character.xp} / {character.xpToNextLevel} XP
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-gold to-accent-orange rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Available Stat Points */}
              {character.availableStatPoints > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center gap-2 text-primary-main text-sm"
                  data-testid="available-stat-points"
                >
                  <Zap size={16} />
                  <span className="font-medium">
                    {character.availableStatPoints} очок характеристик доступно!
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CharacterCard;