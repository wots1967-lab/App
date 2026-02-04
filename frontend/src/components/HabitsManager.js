import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Flame, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HabitsManager = () => {
  const { token } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', description: '', type: 'good' });

  useEffect(() => {
    if (token) {
      fetchHabits();
    }
    // eslint-disable-next-line
  }, [token]);

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

  const handleTrackHabit = async (habitId) => {
    try {
      await axios.post(
        `${API}/habits/${habitId}/track`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Звичку відмічено!');
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
    <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="habits-manager">
      <CardHeader>
        <CardTitle className="text-xl text-text-dark-primary flex items-center justify-between">
          <span>Звички</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            data-testid="toggle-add-habit"
          >
            <Plus size={20} />
          </Button>
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
              
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                  data-testid={`habit-${habit.id}`}
                >
                  <div className={`bg-bg-dark border rounded-lg p-4 hover:border-primary-main/50 transition-colors ${
                    habit.type === 'bad' ? 'border-accent-red/30' : 'border-white/10'
                  }`}>
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={completedToday}
                        onCheckedChange={() => !completedToday && handleTrackHabit(habit.id)}
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
                              {habit.type === 'bad' && (
                                <span className="text-xs bg-accent-red/20 text-accent-red px-2 py-0.5 rounded-full">
                                  Шкідлива
                                </span>
                              )}
                            {habit.description && (
                              <p className="text-sm text-text-dark-secondary mb-2">
                                {habit.description}
                              </p>
                            )}
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
  );
};

export default HabitsManager;