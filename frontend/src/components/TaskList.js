import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Coins, Zap, Trash2, History, Undo2, ChevronDown, ChevronUp, Plus, ListChecks, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TaskList = ({ tasks, loading, onTaskComplete, onTaskDelete, onTaskUncomplete, onAddTaskClick }) => {
  const { token } = useAuth();
  const [completedTasks, setCompletedTasks] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [newStepTitle, setNewStepTitle] = useState('');

  const fetchCompletedTasks = async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const response = await axios.get(`${API}/tasks/archive`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompletedTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch completed tasks:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory && token) {
      fetchCompletedTasks();
    }
    // eslint-disable-next-line
  }, [showHistory, token]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Середньо';
      case 'hard': return 'Важко';
      case 'very_hard': return 'Дуже важко';
      default: return difficulty;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddStep = async (taskId) => {
    if (!newStepTitle.trim()) return;
    
    try {
      await axios.post(
        `${API}/tasks/${taskId}/steps`,
        { title: newStepTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewStepTitle('');
      toast.success('Крок додано');
      // Refresh tasks
      if (onTaskComplete) onTaskComplete(null); // Trigger refresh
    } catch (error) {
      toast.error('Помилка додавання кроку');
    }
  };

  const handleToggleStep = async (taskId, stepId) => {
    try {
      await axios.post(
        `${API}/tasks/${taskId}/steps/${stepId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh tasks
      if (onTaskComplete) onTaskComplete(null);
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const handleDeleteStep = async (taskId, stepId) => {
    try {
      await axios.delete(
        `${API}/tasks/${taskId}/steps/${stepId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Крок видалено');
      if (onTaskComplete) onTaskComplete(null);
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const getStepsProgress = (steps) => {
    if (!steps || steps.length === 0) return 0;
    const completed = steps.filter(s => s.completed).length;
    return (completed / steps.length) * 100;
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
    <div className="space-y-4">
      {/* Active Tasks */}
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="task-list">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-text-dark-primary">
              Сьогоднішні завдання
              <span className="ml-2 text-sm text-text-dark-secondary">({tasks.length})</span>
            </CardTitle>
            <Button
              size="sm"
              onClick={onAddTaskClick}
              className="bg-gradient-to-r from-primary-main to-primary-dark"
              data-testid="add-task-header-btn"
            >
              <Plus size={16} className="mr-1" />
              Додати
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-dark-secondary mb-2">Немає активних завдань</p>
              <p className="text-sm text-text-dark-secondary">Додайте нове завдання, щоб почати!</p>
            </div>
          ) : (
            <AnimatePresence>
              {tasks.map((task, index) => {
                const hasSteps = task.steps && task.steps.length > 0;
                const stepsProgress = getStepsProgress(task.steps);
                const isExpanded = expandedTask === task.id;
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group"
                    data-testid={`task-item-${task.id}`}
                  >
                    <div className="bg-bg-dark border border-white/10 rounded-lg p-4 hover:border-primary-main/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => onTaskComplete(task.id)}
                          className="mt-1"
                          data-testid={`task-checkbox-${task.id}`}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="text-text-dark-primary font-medium mb-1">
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-text-dark-secondary mb-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                className="h-8 w-8 text-text-dark-secondary hover:text-primary-main"
                                title="Кроки"
                              >
                                <ListChecks size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onTaskDelete(task.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                data-testid={`delete-task-${task.id}`}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Steps progress bar */}
                          {hasSteps && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs text-text-dark-secondary mb-1">
                                <span>Кроки: {task.steps.filter(s => s.completed).length}/{task.steps.length}</span>
                                <span>{Math.round(stepsProgress)}%</span>
                              </div>
                              <Progress value={stepsProgress} className="h-1.5" />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn('text-xs border', getDifficultyColor(task.difficulty))}>
                              {getDifficultyLabel(task.difficulty)}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-accent-gold">
                              <Zap size={14} />
                              <span>{task.xpReward} XP</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-accent-gold">
                              <Coins size={14} />
                              <span>{task.coinReward}</span>
                            </div>
                            {task.linkedStats && task.linkedStats.length > 0 && (
                              <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/50">
                                +{task.linkedStats.length} характ.
                              </Badge>
                            )}
                          </div>
                          
                          {/* Expanded steps section */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-white/10"
                              >
                                <p className="text-sm text-text-dark-secondary mb-2">Кроки:</p>
                                <div className="space-y-2">
                                  {task.steps && task.steps.map((step) => (
                                    <div key={step.id} className="flex items-center gap-2 bg-bg-dark-card/50 p-2 rounded">
                                      <Checkbox
                                        checked={step.completed}
                                        onCheckedChange={() => handleToggleStep(task.id, step.id)}
                                        className="h-4 w-4"
                                      />
                                      <span className={`flex-1 text-sm ${step.completed ? 'line-through text-text-dark-secondary' : 'text-text-dark-primary'}`}>
                                        {step.title}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteStep(task.id, step.id)}
                                        className="h-6 w-6 text-red-400 hover:text-red-300"
                                      >
                                        <X size={12} />
                                      </Button>
                                    </div>
                                  ))}
                                  
                                  {/* Add new step */}
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Новий крок..."
                                      value={newStepTitle}
                                      onChange={(e) => setNewStepTitle(e.target.value)}
                                      onKeyPress={(e) => e.key === 'Enter' && handleAddStep(task.id)}
                                      className="flex-1 h-8 bg-bg-dark border-white/10 text-white text-sm"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddStep(task.id)}
                                      className="h-8 bg-primary-main"
                                    >
                                      <Plus size={14} />
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks History */}
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="task-history">
        <CardHeader>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-left"
            data-testid="toggle-history-btn"
          >
            <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
              <History size={20} className="text-primary-main" />
              Історія виконаних
              <span className="text-sm text-text-dark-secondary">({completedTasks.length})</span>
            </CardTitle>
            {showHistory ? <ChevronUp size={20} className="text-text-dark-secondary" /> : <ChevronDown size={20} className="text-text-dark-secondary" />}
          </button>
        </CardHeader>
        
        {showHistory && (
          <CardContent className="space-y-3">
            {historyLoading ? (
              <div className="text-center py-4 text-text-dark-secondary">
                Завантаження...
              </div>
            ) : completedTasks.length === 0 ? (
              <div className="text-center py-4 text-text-dark-secondary">
                Немає виконаних завдань
              </div>
            ) : (
              <AnimatePresence>
                {completedTasks.slice(0, 10).map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="group"
                    data-testid={`completed-task-${task.id}`}
                  >
                    <div className="bg-bg-dark/50 border border-green-500/20 rounded-lg p-3 hover:border-green-500/40 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-400 text-sm">✓</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-text-dark-primary text-sm line-through opacity-70">
                              {task.title}
                            </h4>
                            <p className="text-xs text-text-dark-secondary">
                              {formatDate(task.completedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-xs border', getDifficultyColor(task.difficulty))}>
                            {getDifficultyLabel(task.difficulty)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onTaskUncomplete && onTaskUncomplete(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                            title="Скасувати виконання"
                            data-testid={`uncomplete-task-${task.id}`}
                          >
                            <Undo2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default TaskList;
