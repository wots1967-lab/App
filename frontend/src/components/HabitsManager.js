import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Flame, Plus, Trash2, HelpCircle, X, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QAModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-bg-dark-card border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-text-dark-primary flex items-center gap-2">
              <HelpCircle size={24} className="text-primary-main" />
              Як працює прогрес?
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-text-dark-secondary">
              <X size={20} />
            </Button>
          </div>
          
          <div className="space-y-4 text-text-dark-secondary">
            <div className="bg-bg-dark rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 text-green-400 font-medium mb-2">
                <TrendingUp size={18} />
                Отримання прогресу
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">+1%</span>
                  <span>за кожен день виконання звички</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">+5%</span>
                  <span>бонус за кожні 10 днів підряд</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-bg-dark rounded-lg p-4 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                <Flame size={18} />
                Втрата прогресу
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-1%</span>
                  <span>за кожен пропущений день</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-bg-dark rounded-lg p-4 border border-primary-main/20">
              <div className="flex items-center gap-2 text-primary-main font-medium mb-2">
                <Award size={18} />
                Досягнення 100%
              </div>
              <p className="text-sm">
                Коли прогрес досягне 100%, звичка вважається повністю засвоєною!
              </p>
            </div>
          </div>
          
          <Button onClick={onClose} className="w-full mt-4 bg-gradient-to-r from-primary-main to-primary-dark">
            Зрозуміло!
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const HabitsManager = () => {
  const { token } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', description: '', type: 'good' });

  useEffect(() => {
    if (token) {
      checkMissedDays();
      fetchHabits();
    }
    // eslint-disable-next-line
  }, [token]);

  const checkMissedDays = async () => {
    try {
      const response = await axios.post(
        `${API}/habits/check-missed-days`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.updatedHabits?.length > 0) {
        const totalLost = response.data.updatedHabits.reduce((sum, h) => sum + (h.progressLost || 0), 0);
        if (totalLost > 0) {
          toast.warning(`Прогрес знижено на ${totalLost}% через пропущені дні`);
        }
      }
    } catch (error) {
      console.error('Failed to check missed days:', error);
    }
  };

  const fetchHabits = async () => {
    try {
      const response = await axios.get(`${API}/habits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHabits(response.data);
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;

    try {
      await axios.post(
        `${API}/habits`,
        newHabit,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Звичку додано!');
      setNewHabit({ name: '', description: '', type: 'good' });
      setShowAdd(false);
      fetchHabits();
    } catch (error) {
      toast.error('Помилка при додаванні звички');
      console.error('Failed to add habit:', error);
    }
  };

  const handleTrackHabit = async (habitId, habitType) => {
    try {
      const response = await axios.post(
        `${API}/habits/${habitId}/track`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (habitType === 'bad') {
        toast.warning('Шкідливу звичку відмічено. HP -15');
        if (response.data.penaltyApplied) {
          toast.error('HP впало до 0! Штраф: -2 рівні, -1000 монет');
        }
      } else {
        const progressMsg = response.data.streakBonus 
          ? `+${response.data.progressGain}% (включає бонус за 10 днів!)` 
          : `+${response.data.progressGain}%`;
        toast.success(`Звичку відмічено! ${progressMsg}`);
      }
      fetchHabits();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Вже відмічено сьогодні');
      } else {
        toast.error('Помилка');
      }
      console.error('Failed to track habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await axios.delete(`${API}/habits/${habitId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Звичку видалено');
      fetchHabits();
    } catch (error) {
      toast.error('Помилка при видаленні');
      console.error('Failed to delete habit:', error);
    }
  };

  const isCompletedToday = (habit) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.completionDates?.includes(today);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '[&>div]:bg-green-500';
    if (progress >= 50) return '[&>div]:bg-yellow-500';
    if (progress >= 25) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-red-500';
  };

  if (loading) {
    return (
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
        <CardContent className="py-12 text-center text-text-dark-secondary">
          Завантаження...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="habits-manager">
        <CardHeader>
          <CardTitle className="text-xl text-text-dark-primary flex items-center justify-between">
            <span>Звички</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQA(true)}
                className="text-primary-main hover:text-primary-dark"
                title="Як працює прогрес?"
                data-testid="habits-qa-btn"
              >
                <HelpCircle size={20} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdd(!showAdd)}
                data-testid="toggle-add-habit"
              >
                <Plus size={20} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAdd && (
            <form onSubmit={handleAddHabit} className="space-y-3 p-4 bg-bg-dark rounded-lg border border-white/10">
              <Input
                type="text"
                placeholder="Назва звички..."
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                className="bg-bg-dark-card border-white/10 text-white"
                data-testid="habit-name-input"
              />
              <Input
                type="text"
                placeholder="Опис (опціонально)..."
                value={newHabit.description}
                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                className="bg-bg-dark-card border-white/10 text-white"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewHabit({ ...newHabit, type: 'good' })}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    newHabit.type === 'good'
                      ? 'bg-secondary-main text-white border-secondary-main'
                      : 'bg-bg-dark-card text-text-dark-secondary border-white/10'
                  }`}
                >
                  ✓ Корисна
                </button>
                <button
                  type="button"
                  onClick={() => setNewHabit({ ...newHabit, type: 'bad' })}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    newHabit.type === 'bad'
                      ? 'bg-accent-red text-white border-accent-red'
                      : 'bg-bg-dark-card text-text-dark-secondary border-white/10'
                  }`}
                >
                  ✗ Шкідлива
                </button>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-main to-primary-dark"
                disabled={!newHabit.name.trim()}
                data-testid="add-habit-button"
              >
                Додати звичку
              </Button>
            </form>
          )}

          {habits.length === 0 ? (
            <div className="text-center py-8 text-text-dark-secondary">
              Немає звичок. Додайте першу!
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => {
                const completedToday = isCompletedToday(habit);
                const progress = habit.progress || 0;
                
                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                    data-testid={`habit-${habit.id}`}
                  >
                    <div className={`bg-bg-dark border rounded-lg p-4 hover:border-primary-main/50 transition-colors ${
                      habit.type === 'bad' ? 'border-accent-red/30' : 'border-green-500/30'
                    }`}>
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={completedToday}
                          onCheckedChange={() => !completedToday && handleTrackHabit(habit.id, habit.type)}
                          disabled={completedToday}
                          className="mt-1"
                          data-testid={`habit-checkbox-${habit.id}`}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-text-dark-primary font-medium">
                                  {habit.name}
                                </h3>
                                {habit.type === 'bad' ? (
                                  <span className="text-xs bg-accent-red/20 text-accent-red px-2 py-0.5 rounded-full">
                                    Шкідлива
                                  </span>
                                ) : (
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                    Корисна
                                  </span>
                                )}
                                {progress >= 100 && (
                                  <span className="text-xs bg-primary-main/20 text-primary-main px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Award size={12} /> Засвоєно!
                                  </span>
                                )}
                              </div>
                              {habit.description && (
                                <p className="text-sm text-text-dark-secondary mb-2">
                                  {habit.description}
                                </p>
                              )}
                              
                              {/* Progress Bar */}
                              <div className="mb-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-text-dark-secondary">Прогрес</span>
                                  <span className={`font-medium ${progress >= 100 ? 'text-green-400' : 'text-text-dark-primary'}`}>
                                    {progress}%
                                  </span>
                                </div>
                                <Progress 
                                  value={Math.min(progress, 100)} 
                                  className={`h-2 ${getProgressColor(progress)}`}
                                />
                              </div>
                              
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1 text-accent-orange">
                                  <Flame size={16} />
                                  <span className="font-bold" data-testid={`habit-streak-${habit.id}`}>{habit.streak} днів</span>
                                </div>
                                <span className="text-text-dark-secondary">
                                  Краща серія: {habit.bestStreak}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteHabit(habit.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                              data-testid={`delete-habit-${habit.id}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <QAModal isOpen={showQA} onClose={() => setShowQA(false)} />
    </>
  );
};

export default HabitsManager;
