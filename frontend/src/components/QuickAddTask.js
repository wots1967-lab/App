import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, X, ListChecks, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEFAULT_STATS = [
  { key: 'strength', label: 'Сила', icon: '💪' },
  { key: 'intelligence', label: 'Інтелект', icon: '🧠' },
  { key: 'stamina', label: 'Витривалість', icon: '❤️' },
  { key: 'agility', label: 'Спритність', icon: '⚡' },
  { key: 'creativity', label: 'Креативність', icon: '🎨' },
  { key: 'charisma', label: 'Харизма', icon: '👥' }
];

const QuickAddTask = ({ onTaskAdded }) => {
  const { user, token } = useAuth();
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Steps
  const [steps, setSteps] = useState([]);
  const [newStep, setNewStep] = useState('');
  
  // Linked stats
  const [linkedStats, setLinkedStats] = useState([]);
  const [customStats, setCustomStats] = useState([]);

  useEffect(() => {
    if (user?.character?.customStats && Array.isArray(user.character.customStats)) {
      setCustomStats(user.character.customStats);
    } else {
      setCustomStats([]);
    }
  }, [user]);

  const allStats = [
    ...DEFAULT_STATS,
    ...customStats
      .filter(cs => cs && (cs.key || cs.id))
      .map(cs => ({
        key: cs.key || cs.id,
        label: cs.label || 'Без назви',
        icon: cs.icon || '⭐'
      }))
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API}/tasks`,
        {
          title: title.trim(),
          type: 'daily',
          difficulty,
          skills: [],
          tags,
          linkedStats,
          steps: steps.map(s => ({ title: s })),
          priority: 'medium'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Завдання додано!');
      setTitle('');
      setDifficulty('medium');
      setTags([]);
      setSteps([]);
      setLinkedStats([]);
      setShowAdvanced(false);
      if (onTaskAdded) onTaskAdded();
    } catch (error) {
      toast.error('Помилка при додаванні завдання');
      console.error('Failed to add task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleAddStep = () => {
    if (newStep.trim()) {
      setSteps([...steps, newStep.trim()]);
      setNewStep('');
    }
  };

  const toggleStat = (statKey) => {
    if (linkedStats.includes(statKey)) {
      setLinkedStats(linkedStats.filter(s => s !== statKey));
    } else {
      setLinkedStats([...linkedStats, statKey]);
    }
  };

  return (
    <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="quick-add-task">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg text-text-dark-primary flex items-center gap-2">
          <Plus size={18} className="text-primary-main sm:w-5 sm:h-5" />
          Швидке додавання
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
          <Input
            type="text"
            placeholder="Нове завдання..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-bg-dark border-white/10 text-white focus:border-primary-main text-sm sm:text-base h-9 sm:h-10"
            data-testid="task-title-input"
          />
          
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="bg-bg-dark border-white/10 text-white text-sm sm:text-base h-9 sm:h-10" data-testid="difficulty-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-dark-card border-white/10">
              <SelectItem value="easy">Легко (15 XP)</SelectItem>
              <SelectItem value="medium">Середньо (35 XP)</SelectItem>
              <SelectItem value="hard">Важко (75 XP)</SelectItem>
              <SelectItem value="very_hard">Дуже важко (150 XP)</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle advanced options */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-start text-text-dark-secondary hover:text-primary-main text-sm sm:text-base h-8 sm:h-9"
          >
            <Sparkles size={14} className="mr-2 sm:w-4 sm:h-4" />
            {showAdvanced ? 'Приховати опції' : 'Додаткові опції'}
          </Button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 sm:space-y-4 overflow-hidden"
              >
                {/* Steps */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm text-text-dark-secondary flex items-center gap-2">
                    <ListChecks size={14} className="sm:w-4 sm:h-4" />
                    Кроки (підзавдання)
                  </label>
                  
                  {steps.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-bg-dark/50 p-2 rounded text-xs sm:text-sm">
                          <span className="text-text-dark-secondary">{idx + 1}.</span>
                          <span className="flex-1 text-text-dark-primary truncate">{step}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                            className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 flex-shrink-0"
                          >
                            <X size={10} className="sm:w-3 sm:h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Додати крок..."
                      value={newStep}
                      onChange={(e) => setNewStep(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
                      className="bg-bg-dark border-white/10 text-white text-xs sm:text-sm h-8 sm:h-9"
                    />
                    <Button type="button" onClick={handleAddStep} variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                      +
                    </Button>
                  </div>
                </div>

                {/* Linked Stats */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm text-text-dark-secondary">
                    Характеристики (+1 при виконанні)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-2 max-h-48 overflow-y-auto">
                    {allStats.map((stat) => (
                      <div
                        key={stat.key}
                        onClick={() => toggleStat(stat.key)}
                        className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-colors ${
                          linkedStats.includes(stat.key)
                            ? 'border-primary-main bg-primary-main/20'
                            : 'border-white/10 bg-bg-dark/50 hover:border-white/30'
                        }`}
                      >
                        <Checkbox
                          checked={linkedStats.includes(stat.key)}
                          className="pointer-events-none h-3 w-3 sm:h-4 sm:w-4"
                        />
                        <span className="text-sm sm:text-lg">{stat.icon}</span>
                        <span className="text-xs sm:text-sm text-text-dark-primary truncate">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                  {linkedStats.length > 0 && (
                    <p className="text-xs text-primary-main">
                      Обрано: {linkedStats.length}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm text-text-dark-secondary">Теги</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Додати тег..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="bg-bg-dark border-white/10 text-white focus:border-primary-main text-xs sm:text-sm h-8 sm:h-9"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                      +
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="bg-primary-main/20 text-primary-main text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          {tag}
                          <button type="button" onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="hover:text-white">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-main to-primary-dark hover:shadow-primary-glow text-sm sm:text-base h-9 sm:h-10"
            disabled={loading || !title.trim()}
            data-testid="add-task-button"
          >
            {loading ? 'Додавання...' : 'Додати завдання'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuickAddTask;
