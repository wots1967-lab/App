import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, Minus, Trash2, Edit2, X, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEFAULT_STATS = [
  { key: 'strength', label: 'Сила', icon: '💪', color: 'text-red-400' },
  { key: 'intelligence', label: 'Інтелект', icon: '🧠', color: 'text-blue-400' },
  { key: 'stamina', label: 'Витривалість', icon: '❤️', color: 'text-green-400' },
  { key: 'agility', label: 'Спритність', icon: '⚡', color: 'text-yellow-400' },
  { key: 'creativity', label: 'Креативність', icon: '🎨', color: 'text-purple-400' },
  { key: 'charisma', label: 'Харизма', icon: '👥', color: 'text-pink-400' }
];

const ICON_OPTIONS = ['⭐', '🎯', '📚', '🏃', '💼', '🎮', '🎵', '🌟', '🔥', '💎', '🌈', '🎨'];
const COLOR_OPTIONS = [
  { value: 'text-white', label: 'Білий' },
  { value: 'text-red-400', label: 'Червоний' },
  { value: 'text-blue-400', label: 'Синій' },
  { value: 'text-green-400', label: 'Зелений' },
  { value: 'text-yellow-400', label: 'Жовтий' },
  { value: 'text-purple-400', label: 'Фіолетовий' },
  { value: 'text-pink-400', label: 'Рожевий' },
  { value: 'text-orange-400', label: 'Помаранчевий' },
  { value: 'text-cyan-400', label: 'Бірюзовий' },
];

const CharacterStats = () => {
  const { user, token, updateUser } = useAuth();
  const [allocation, setAllocation] = useState({});
  const [customAllocation, setCustomAllocation] = useState({});
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newStatLabel, setNewStatLabel] = useState('');
  const [newStatIcon, setNewStatIcon] = useState('⭐');
  const [newStatColor, setNewStatColor] = useState('text-white');
  const [editingStatId, setEditingStatId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const character = user?.character;
  if (!character) return null;

  const customStats = character.customStats || [];
  const standardAllocationTotal = Object.values(allocation).reduce((a, b) => a + b, 0);
  const customAllocationTotal = Object.values(customAllocation).reduce((a, b) => a + b, 0);
  const availablePoints = character.availableStatPoints - standardAllocationTotal - customAllocationTotal;

  const handleIncrement = (stat, isCustom = false) => {
    if (availablePoints > 0) {
      if (isCustom) {
        setCustomAllocation(prev => ({ ...prev, [stat]: (prev[stat] || 0) + 1 }));
      } else {
        setAllocation(prev => ({ ...prev, [stat]: (prev[stat] || 0) + 1 }));
      }
    }
  };

  const handleDecrement = (stat, isCustom = false) => {
    if (isCustom) {
      if ((customAllocation[stat] || 0) > 0) {
        setCustomAllocation(prev => ({ ...prev, [stat]: prev[stat] - 1 }));
      }
    } else {
      if ((allocation[stat] || 0) > 0) {
        setAllocation(prev => ({ ...prev, [stat]: prev[stat] - 1 }));
      }
    }
  };

  const handleAllocate = async () => {
    const totalAllocated = standardAllocationTotal + customAllocationTotal;
    if (totalAllocated === 0) {
      toast.error('Виберіть характеристики для розподілу');
      return;
    }

    try {
      // Allocate standard stats
      if (standardAllocationTotal > 0) {
        const response = await axios.post(
          `${API}/user/allocate-stats`,
          { stats: allocation },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedUser = { ...user, character: response.data };
        updateUser(updatedUser);
      }

      // Allocate custom stats
      if (customAllocationTotal > 0) {
        const response = await axios.post(
          `${API}/user/allocate-custom-stats`,
          customAllocation,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedUser = { ...user, character: response.data };
        updateUser(updatedUser);
      }
      
      setAllocation({});
      setCustomAllocation({});
      toast.success('Характеристики розподілені!');
    } catch (error) {
      toast.error('Помилка при розподілі характеристик');
      console.error('Failed to allocate stats:', error);
    }
  };

  const handleAddCustomStat = async () => {
    if (!newStatLabel.trim()) {
      toast.error('Введіть назву характеристики');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/user/custom-stats`,
        { label: newStatLabel, icon: newStatIcon, color: newStatColor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedCustomStats = [...customStats, response.data];
      const updatedUser = { ...user, character: { ...character, customStats: updatedCustomStats } };
      updateUser(updatedUser);
      
      setNewStatLabel('');
      setNewStatIcon('⭐');
      setNewStatColor('text-white');
      setShowAddCustom(false);
      toast.success('Характеристику додано!');
    } catch (error) {
      toast.error('Помилка при додаванні');
    }
  };

  const handleDeleteCustomStat = async (statId) => {
    try {
      const response = await axios.delete(
        `${API}/user/custom-stats/${statId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedCustomStats = customStats.filter(s => s.id !== statId);
      const updatedUser = { 
        ...user, 
        character: { 
          ...character, 
          customStats: updatedCustomStats,
          availableStatPoints: response.data.availableStatPoints
        } 
      };
      updateUser(updatedUser);
      
      toast.success(`Повернено ${response.data.pointsReturned} очок`);
    } catch (error) {
      toast.error('Помилка при видаленні');
    }
  };

  const handleUpdateCustomStat = async (statId) => {
    try {
      await axios.put(
        `${API}/user/custom-stats/${statId}`,
        { label: editLabel, icon: editIcon },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedCustomStats = customStats.map(s => 
        s.id === statId ? { ...s, label: editLabel, icon: editIcon } : s
      );
      const updatedUser = { ...user, character: { ...character, customStats: updatedCustomStats } };
      updateUser(updatedUser);
      
      setEditingStatId(null);
      toast.success('Оновлено!');
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const startEditing = (stat) => {
    setEditingStatId(stat.id);
    setEditLabel(stat.label);
    setEditIcon(stat.icon);
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
        {/* Standard Stats */}
        {DEFAULT_STATS.map((stat) => {
          const currentValue = character.stats[stat.key] || 0;
          const newValue = currentValue + (allocation[stat.key] || 0);
          const percentage = Math.min((newValue / 100) * 100, 100);

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
                        disabled={(allocation[stat.key] || 0) === 0}
                        className="h-6 w-6"
                      >
                        <Minus size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleIncrement(stat.key)}
                        disabled={availablePoints === 0}
                        className="h-6 w-6"
                      >
                        <Plus size={14} />
                      </Button>
                    </>
                  )}
                  <span className={`font-bold ${stat.color} min-w-[3rem] text-right`}>
                    {currentValue}
                    {(allocation[stat.key] || 0) > 0 && (
                      <span className="text-primary-main"> +{allocation[stat.key]}</span>
                    )}
                  </span>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}

        {/* Custom Stats */}
        {customStats.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-text-dark-secondary mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-primary-main" />
              Кастомні характеристики
            </p>
            {customStats.map((stat) => {
              const currentValue = stat.value || 0;
              const newValue = currentValue + (customAllocation[stat.id] || 0);
              const percentage = Math.min((newValue / 100) * 100, 100);

              return (
                <div key={stat.id} className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {editingStatId === stat.id ? (
                        <>
                          <select 
                            value={editIcon} 
                            onChange={(e) => setEditIcon(e.target.value)}
                            className="bg-bg-dark text-xl w-12 h-8 rounded"
                          >
                            {ICON_OPTIONS.map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="h-7 text-sm bg-bg-dark border-white/10 w-24"
                          />
                          <Button size="icon" className="h-6 w-6" onClick={() => handleUpdateCustomStat(stat.id)}>
                            <Check size={12} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingStatId(null)}>
                            <X size={12} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">{stat.icon}</span>
                          <span className={`text-sm ${stat.color || 'text-text-dark-primary'}`}>{stat.label}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(stat)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                          >
                            <Edit2 size={12} />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {character.availableStatPoints > 0 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDecrement(stat.id, true)}
                            disabled={(customAllocation[stat.id] || 0) === 0}
                            className="h-6 w-6"
                          >
                            <Minus size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleIncrement(stat.id, true)}
                            disabled={availablePoints === 0}
                            className="h-6 w-6"
                          >
                            <Plus size={14} />
                          </Button>
                        </>
                      )}
                      <span className={`font-bold ${stat.color || 'text-white'} min-w-[3rem] text-right`}>
                        {currentValue}
                        {(customAllocation[stat.id] || 0) > 0 && (
                          <span className="text-primary-main"> +{customAllocation[stat.id]}</span>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCustomStat(stat.id)}
                        className="h-6 w-6 text-red-400 hover:text-red-300"
                        title={`Видалити (повернути ${currentValue} очок)`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        )}

        {/* Add Custom Stat */}
        <AnimatePresence>
          {showAddCustom ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-3 border-t border-white/10"
            >
              <p className="text-sm text-text-dark-secondary">Нова характеристика:</p>
              <div className="flex gap-2">
                <select 
                  value={newStatIcon} 
                  onChange={(e) => setNewStatIcon(e.target.value)}
                  className="bg-bg-dark border border-white/10 text-xl w-14 h-9 rounded"
                >
                  {ICON_OPTIONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
                <Input
                  placeholder="Назва..."
                  value={newStatLabel}
                  onChange={(e) => setNewStatLabel(e.target.value)}
                  className="flex-1 bg-bg-dark border-white/10 text-white"
                />
              </div>
              <select 
                value={newStatColor} 
                onChange={(e) => setNewStatColor(e.target.value)}
                className="w-full bg-bg-dark border border-white/10 text-white h-9 rounded px-2"
              >
                {COLOR_OPTIONS.map(color => (
                  <option key={color.value} value={color.value} className={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button onClick={handleAddCustomStat} className="flex-1 bg-primary-main">
                  Додати
                </Button>
                <Button variant="outline" onClick={() => setShowAddCustom(false)}>
                  Скасувати
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAddCustom(true)}
              className="w-full border-dashed border-white/20 text-text-dark-secondary hover:text-primary-main hover:border-primary-main/50"
            >
              <Plus size={16} className="mr-2" />
              Додати кастомну характеристику
            </Button>
          )}
        </AnimatePresence>

        {/* Allocate Button */}
        {character.availableStatPoints > 0 && (standardAllocationTotal + customAllocationTotal) > 0 && (
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
