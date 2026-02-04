import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CharacterStats = () => {
  const { user, token, updateUser } = useAuth();
  const [allocation, setAllocation] = useState({
    strength: 0,
    intelligence: 0,
    stamina: 0,
    agility: 0,
    creativity: 0,
    charisma: 0
  });

  const character = user?.character;
  if (!character) return null;

  const availablePoints = character.availableStatPoints - Object.values(allocation).reduce((a, b) => a + b, 0);

  const stats = [
    { key: 'strength', label: 'Сила', icon: '💪', color: 'text-red-400' },
    { key: 'intelligence', label: 'Інтелект', icon: '🧠', color: 'text-blue-400' },
    { key: 'stamina', label: 'Витривалість', icon: '❤️', color: 'text-green-400' },
    { key: 'agility', label: 'Спритність', icon: '⚡', color: 'text-yellow-400' },
    { key: 'creativity', label: 'Креативність', icon: '🎨', color: 'text-purple-400' },
    { key: 'charisma', label: 'Харизма', icon: '👥', color: 'text-pink-400' }
  ];

  const handleIncrement = (stat) => {
    if (availablePoints > 0) {
      setAllocation(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
    }
  };

  const handleDecrement = (stat) => {
    if (allocation[stat] > 0) {
      setAllocation(prev => ({ ...prev, [stat]: prev[stat] - 1 }));
    }
  };

  const handleAllocate = async () => {
    const totalAllocated = Object.values(allocation).reduce((a, b) => a + b, 0);
    if (totalAllocated === 0) {
      toast.error('Виберіть характеристики для розподілу');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/user/allocate-stats`,
        { stats: allocation },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...user, character: response.data };
      updateUser(updatedUser);
      
      setAllocation({
        strength: 0,
        intelligence: 0,
        stamina: 0,
        agility: 0,
        creativity: 0,
        charisma: 0
      });

      toast.success('Характеристики розподілені!');
    } catch (error) {
      toast.error('Помилка при розподілі характеристик');
      console.error('Failed to allocate stats:', error);
    }
  };

  return (
    <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="character-stats">
      <CardHeader>
        <CardTitle className="text-lg text-text-dark-primary flex items-center justify-between">
          <span>Характеристики</span>
          {character.availableStatPoints > 0 && (
            <span className="text-primary-main text-sm" data-testid="available-points">
              {availablePoints} очок доступно
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => {
          const currentValue = character.stats[stat.key];
          const newValue = currentValue + allocation[stat.key];
          const percentage = (newValue / 100) * 100;

          return (
            <div key={stat.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{stat.icon}</span>
                  <span className="text-sm text-text-dark-primary">{stat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {character.availableStatPoints > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDecrement(stat.key)}
                        disabled={allocation[stat.key] === 0}
                        className="h-6 w-6"
                        data-testid={`decrement-${stat.key}`}
                      >
                        <Minus size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleIncrement(stat.key)}
                        disabled={availablePoints === 0}
                        className="h-6 w-6"
                        data-testid={`increment-${stat.key}`}
                      >
                        <Plus size={14} />
                      </Button>
                    </>
                  )}
                  <span className={`font-bold ${stat.color} min-w-[3rem] text-right`} data-testid={`${stat.key}-value`}>
                    {currentValue}
                    {allocation[stat.key] > 0 && (
                      <span className="text-primary-main"> +{allocation[stat.key]}</span>
                    )}
                  </span>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}

        {character.availableStatPoints > 0 && Object.values(allocation).reduce((a, b) => a + b, 0) > 0 && (
          <Button
            onClick={handleAllocate}
            className="w-full bg-gradient-to-r from-primary-main to-primary-dark hover:shadow-primary-glow"
            data-testid="allocate-stats-button"
          >
            Підтвердити розподіл
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CharacterStats;