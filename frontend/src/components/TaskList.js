import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Coins, Zap, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

const TaskList = ({ tasks, loading, onTaskComplete, onTaskDelete }) => {
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
      default: return difficulty;
    }
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

  if (tasks.length === 0) {
    return (
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
        <CardContent className="py-12 text-center">
          <p className="text-text-dark-secondary mb-2">Немає активних завдань</p>
          <p className="text-sm text-text-dark-secondary">Додайте нове завдання, щоб почати!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="task-list">
      <CardHeader>
        <CardTitle className="text-xl text-text-dark-primary">
          Сьогоднішні завдання
          <span className="ml-2 text-sm text-text-dark-secondary">({tasks.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {tasks.map((task, index) => (
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
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default TaskList;