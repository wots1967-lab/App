import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Target, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuestsManager = () => {
  const { token } = useAuth();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    steps: [{ title: '' }]
  });

  useEffect(() => {
    if (token) {
      fetchQuests();
    }
    // eslint-disable-next-line
  }, [token]);

  const fetchQuests = async () => {
    try {
      const response = await axios.get(`${API}/quests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuests(response.data);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuest = async (e) => {
    e.preventDefault();
    if (!newQuest.title.trim()) return;

    const validSteps = newQuest.steps.filter(s => s.title.trim());
    if (validSteps.length === 0) {
      toast.error('Додайте хоча б один крок');
      return;
    }

    try {
      await axios.post(
        `${API}/quests`,
        { ...newQuest, steps: validSteps },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Квест створено!');
      setNewQuest({ title: '', description: '', difficulty: 'medium', steps: [{ title: '' }] });
      setShowAdd(false);
      fetchQuests();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const handleCompleteStep = async (questId) => {
    try {
      await axios.post(
        `${API}/quests/${questId}/next-step`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Крок виконано!');
      fetchQuests();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const handleDeleteQuest = async (questId) => {
    try {
      await axios.delete(`${API}/quests/${questId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Квест видалено');
      fetchQuests();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  // Separate the filtering logic to avoid babel plugin issues
  const activeQuests = quests.filter(q => !q.completed);

  const renderQuestItem = (quest) => {
    const progress = (quest.currentStep / quest.steps.length) * 100;
    
    return (
      <motion.div key={quest.id} className="group" data-testid={`quest-${quest.id}`}>
        <div className="bg-bg-dark border border-white/10 rounded-lg p-4 hover:border-primary-main/50 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-text-dark-primary font-bold mb-1">{quest.title}</h3>
              <p className="text-sm text-text-dark-secondary">Крок {quest.currentStep + 1} / {quest.steps.length}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteQuest(quest.id)}
              className="opacity-0 group-hover:opacity-100 text-red-400"
              data-testid={`delete-quest-${quest.id}`}
            >
              <Trash2 size={16} />
            </Button>
          </div>
          <Progress value={progress} className="mb-3" />
          {quest.currentStep < quest.steps.length && (
            <div className="bg-bg-dark-card p-3 rounded-lg mb-2">
              <p className="text-text-dark-primary text-sm mb-2">{quest.steps[quest.currentStep].title}</p>
              <Button
                size="sm"
                onClick={() => handleCompleteStep(quest.id)}
                className="bg-gradient-to-r from-secondary-main to-green-600"
                data-testid={`complete-quest-step-${quest.id}`}
              >
                <CheckCircle2 size={16} className="mr-1" />
                Виконати крок
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="quests-manager">
      <CardHeader>
        <CardTitle className="text-xl text-text-dark-primary flex items-center justify-between">
          <span>Квести</span>
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)} data-testid="toggle-add-quest">
            <Plus size={20} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <form onSubmit={handleAddQuest} className="space-y-3 p-4 bg-bg-dark rounded-lg border border-white/10">
            <Input
              placeholder="Назва квесту..."
              value={newQuest.title}
              onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
              className="bg-bg-dark-card border-white/10 text-white"
              data-testid="quest-title-input"
            />
            {newQuest.steps.map((step, idx) => (
              <Input
                key={idx}
                placeholder={`Крок ${idx + 1}...`}
                value={step.title}
                onChange={(e) => {
                  const steps = [...newQuest.steps];
                  steps[idx].title = e.target.value;
                  setNewQuest({ ...newQuest, steps });
                }}
                className="bg-bg-dark-card border-white/10 text-white"
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewQuest({ ...newQuest, steps: [...newQuest.steps, { title: '' }] })}
              className="w-full"
            >
              + Додати крок
            </Button>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary-main to-primary-dark" data-testid="create-quest-button">
              Створити квест
            </Button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8 text-text-dark-secondary">Завантаження...</div>
        ) : quests.length === 0 ? (
          <div className="text-center py-8 text-text-dark-secondary">Немає квестів</div>
        ) : (
          <div className="space-y-4">
            {activeQuests.map(renderQuestItem)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestsManager;